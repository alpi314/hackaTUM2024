"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import idl from "./idl.json";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);
const WalletModalProvider = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletModalProvider
    ),
  { ssr: false }
);
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

import { useMapEvents } from "react-leaflet";

import "@solana/wallet-adapter-react-ui/styles.css";
import "leaflet/dist/leaflet.css";

import {
  Container,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DownloadIcon from '@mui/icons-material/Download';

const wallets = [new PhantomWalletAdapter()];
const programID = new PublicKey("48zQM2WJcVtJYyv2gf2PqsCYawgFkEW9ZqrT61DTAZ7J");
const network = "https://devnet.helius-rpc.com/?api-key=ec39cc38-e55f-411b-98b1-019788078549";
const commitment = "processed";

const theme = createTheme({
  palette: {
    primary: { main: "#6a1b9a" }, // Purple accent
    secondary: { main: "#424242" }, // Dark gray
    background: {
      default: "#f5f5f5", // Light gray background
      paper: "#ffffff", // White cards
    },
    text: {
      primary: "#212121", // Dark text
      secondary: "#757575", // Gray text
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          borderRadius: "12px",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: "#6a1b9a",
          "&:hover": {
            backgroundColor: "#4a148c",
          },
        },
        containedSecondary: {
          backgroundColor: "#424242",
          "&:hover": {
            backgroundColor: "#212121",
          },
        },
      },
    },
  },
});

let ext_con_confirm = false;

const App = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfHash, setPdfHash] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [price, setPrice] = useState("");
  const [logs, setLogs] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [withdrawLogs, setWithdrawLogs] = useState("");
  const [withdrawTxSignature, setWithdrawTxSignature] = useState("");
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [dataAccountPDA, setDataAccountPDA] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 51.505,
    lng: -0.09,
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [listings, setListings] = useState([]);

  const wallet = useWallet();
  const connection = new Connection(network, commitment);

  useEffect(() => {
    setIsMounted(true);
    // Mock listings for Dingolfing
    setListings([
      {
        id: 1,
        price: "180.000 EUR",
        location: "Dingolfing, Bavaria",
        description: "Beautiful Home available.",
        descriptionPdf: "/pdfs/listing1-description.pdf",
        migrationProofPdf: "/pdfs/listing1-proof.pdf",
      },
      {
        id: 2,
        price: "250.000 EUR",
        location: "Dingolfing, Bavaria",
        description: "Prime location for your family.",
        descriptionPdf: "/pdfs/listing2-description.pdf",
        migrationProofPdf: "/pdfs/listing2-proof.pdf",
      },
    ]);
  }, []);

  if (!isMounted) {
    return null;
  }

  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: commitment,
  });
  anchor.setProvider(provider);

  const program = new anchor.Program(idl, programID);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setPdfFile(file);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setPdfHash(hashHex);
        console.log("PDF Hash:", hashHex);
      } catch (error) {
        console.error("Error hashing PDF file:", error);
        alert("Failed to hash the PDF file. Please try again.");
      }
    } else {
      setPdfFile(null);
      setPdfHash("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!pdfHash || !latitude || !longitude || !price) {
      alert("All fields are required.");
      return;
    }

    try {
      const [dataAccountPDA, bump] = await PublicKey.findProgramAddress(
        [Buffer.from("data_account"), wallet.publicKey.toBuffer()],
        programID
      );
      setDataAccountPDA(dataAccountPDA);

      const depositAmount = 0.1 * anchor.web3.LAMPORTS_PER_SOL;

      const tx = await program.methods
        .submitData(
          pdfHash,
          latitude,
          longitude,
          new anchor.BN(price),
          new anchor.BN(depositAmount)
        )
        .accounts({
          user: wallet.publicKey,
          dataAccount: dataAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([])
        .rpc({ commitment: "confirmed", preflightCommitment: "confirmed" });

      setTxSignature(tx);
      setLogs("Transaction successful!");

      setTimeout(() => {
        setCanWithdraw(true);
      }, 10000);
    } catch (error) {
      console.error("Transaction failed:", error);
      setLogs(`Transaction failed: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    try {
      const tx = await program.methods
        .withdraw()
        .accounts({
          user: wallet.publicKey,
          dataAccount: dataAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed", preflightCommitment: "confirmed" });
  
      setWithdrawTxSignature(tx);
      setWithdrawLogs("Withdrawal transaction successful!");
  
      if (ext_con_confirm) {
        setDialogMessage("RWRD tokens have been successfully reserved for you!");
      } else {
        setDialogMessage(
          "There were more objectors than approvers for the migration. Withdrawal and minting cannot be done until the community is convinced. Please try to start another migration process."
        );
      }
      setOpenDialog(true);
    } catch (error) {
      setWithdrawLogs(`Withdrawal transaction failed: ${error.message}`);
      setDialogMessage(
        "There were more objectors than approvers for the migration. Withdrawal and minting cannot be done until the community is convinced. Please try to start another migration process."
      );
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
        setLatitude(lat.toString());
        setLongitude(lng.toString());
      },
    });

    return selectedLocation ? (
      <Marker position={selectedLocation}></Marker>
    ) : null;
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "40px", marginBottom: "40px" }}>
      <WalletModalProvider>
        <Grid container justifyContent="flex-end">
          <WalletMultiButton />
        </Grid>
      </WalletModalProvider>

      {wallet.connected ? (
        <>
          <Card variant="outlined" style={{ marginTop: "30px" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Migrate Advert
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="file"
                      label="Upload PDF"
                      InputLabelProps={{ shrink: true }}
                      onChange={handleFileUpload}
                      InputProps={{
                        inputProps: { accept: "application/pdf" },
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={`Lat: ${latitude}, Lng: ${longitude}`}
                      label="Selected Location"
                      InputProps={{ readOnly: true }}
                    />
                    <div style={{ height: "400px", width: "100%", marginTop: "15px", borderRadius: "8px", overflow: "hidden" }}>
                      <MapContainer
                        center={selectedLocation}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker />
                      </MapContainer>
                    </div>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="number"
                      label="Price (in EUR)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      inputProps={{ min: "0", step: "0.01" }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disableElevation
                    >
                      Submit
                    </Button>
                  </Grid>
                </Grid>
              </form>
              {logs && (
                <Typography style={{ marginTop: "20px" }}>
                  <strong>Status:</strong> {logs}
                </Typography>
              )}
              {txSignature && (
                <Typography style={{ marginTop: "10px" }}>
                  <strong>Transaction Link:</strong>{" "}
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
                  >
                    View on Solana Explorer
                  </a>
                </Typography>
              )}
            </CardContent>
          </Card>

          {txSignature && (
            <Card variant="outlined" style={{ marginTop: "30px" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Withdraw Deposit
                </Typography>
                <Button
                  onClick={handleWithdraw}
                  disabled={!canWithdraw}
                  variant="contained"
                  color="secondary"
                  disableElevation
                  style={{ marginBottom: "10px" }}
                >
                  Withdraw
                </Button>
                {withdrawLogs && <Typography>{withdrawLogs}</Typography>}
                {withdrawTxSignature && (
                  <Typography>
                    <strong>Withdrawal Transaction Link:</strong>{" "}
                    <a
                      href={`https://explorer.solana.com/tx/${withdrawTxSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
                    >
                      View on Solana Explorer
                    </a>
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card variant="outlined" style={{ marginTop: "30px", padding: "20px" }}>
          <CardContent>
            <Typography variant="h6" align="center">
              Please connect your wallet to submit data.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Withdrawal Status</DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Card variant="outlined" style={{ marginTop: "40px" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Listings in Dingolfing
          </Typography>
          <List>
            {listings.map((listing) => (
              <React.Fragment key={listing.id}>
                <ListItem alignItems="flex-start" secondaryAction={
                  <div>
                    <IconButton
                      edge="end"
                      aria-label="download description"
                      href={listing.descriptionPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="download migration proof"
                      href={listing.migrationProofPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </div>
                }>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" color="text.primary">
                        {listing.location} - {listing.price}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {listing.description}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
          <Typography variant="body2" style={{ marginTop: "15px", color: theme.palette.text.secondary }}>
            Currently showing listings for Dingolfing. Search for listings in other locations soon!
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

const Home = () => (
  <ThemeProvider theme={theme}>
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect>
        <App />
      </WalletProvider>
    </ConnectionProvider>
  </ThemeProvider>
);

export default Home;
