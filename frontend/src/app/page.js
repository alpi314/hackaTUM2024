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
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

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
  Box,
  Paper,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import InputAdornment from '@mui/material/InputAdornment';
import { grey } from "@mui/material/colors";

const wallets = [new PhantomWalletAdapter()];
const programID = new PublicKey("48zQM2WJcVtJYyv2gf2PqsCYawgFkEW9ZqrT61DTAZ7J");
// const network = "https://devnet.helius-rpc.com/?api-key=ec39cc38-e55f-411b-98b1-019788078549";
const network = "https://devnet.helius-rpc.com/?api-key=6cee5706-5f3c-4353-92fe-14329107751e";
const commitment = "processed";

const theme = createTheme({
  palette: {
    primary: { main: "#6a1b9a" }, // Purple accent
    secondary: { main: "#424242" }, // Dark gray
    background: {
      default: "#f0f2f5", // Light gray background
      paper: "#ffffff", // White cards
    },
    text: {
      primary: "#212121", // Dark text
      secondary: "#757575", // Gray text
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h4: {
      fontWeight: 700,
      marginBottom: "20px",
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
    body1: {
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 25px rgba(0, 0, 0, 0.1)",
          borderRadius: "16px",
          padding: "20px",
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
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: "8px",
        },
      },
    },
  },
});

const App = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfHash, setPdfHash] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [price, setPrice] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logs, setLogs] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [withdrawLogs, setWithdrawLogs] = useState("");
  const [withdrawTxSignature, setWithdrawTxSignature] = useState("");
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [dataAccountPDA, setDataAccountPDA] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 48.2632, // Example coordinates for Dingolfing
    lng: 12.5250,
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [filteredListings, setFilteredListings] = useState([]); // State for filtered listings

  const wallet = useWallet();
  const connection = new Connection(network, commitment);

  useEffect(() => {
    setIsMounted(true);
    // Expanded mock listings for Dingolfing with exact addresses and precise coordinates
    setListings([
      {
        id: 1,
        price: "(FOR SALE) 180.000 EUR",
        location: "Dingolfing, Bavaria",
        address: "Musterstraße 1, 94469 Dingolfing, Germany",
        description: "Beautiful Home available.",
        descriptionPdf: "/pdfs/listing1-description.pdf",
        migrationProofPdf: "/pdfs/listing1-proof.pdf",
        coordinates: { lat: 48.2632, lng: 12.5250 },
        email: "contact1@example.com",
        phone: "+49 89 123456",
      },
      {
        id: 2,
        price: "(FOR SALE) 250.000 EUR",
        location: "Dingolfing, Bavaria",
        address: "Beispielweg 5, 94469 Dingolfing, Germany",
        description: "Prime location for your family.",
        descriptionPdf: "/pdfs/listing2-description.pdf",
        migrationProofPdf: "/pdfs/listing2-proof.pdf",
        coordinates: { lat: 48.2645, lng: 12.5275 },
        email: "contact2@example.com",
        phone: "+49 89 654321",
      },
      {
        id: 3,
        price: "(FOR SALE) 300.000 EUR",
        location: "Dingolfing, Bavaria",
        address: "Villaweg 10, 94469 Dingolfing, Germany",
        description: "Spacious villa with modern amenities.",
        descriptionPdf: "/pdfs/listing3-description.pdf",
        migrationProofPdf: "/pdfs/listing3-proof.pdf",
        coordinates: { lat: 48.2650, lng: 12.5300 },
        email: "contact3@example.com",
        phone: "+49 89 112233",
      },
      {
        id: 4,
        price: "(FOR SALE) 150.000 EUR",
        location: "Dingolfing, Bavaria",
        address: "Altstadtgasse 15, 94469 Dingolfing, Germany",
        description: "Cozy apartment close to city center.",
        descriptionPdf: "/pdfs/listing4-description.pdf",
        migrationProofPdf: "/pdfs/listing4-proof.pdf",
        coordinates: { lat: 48.2620, lng: 12.5230 },
        email: "contact4@example.com",
        phone: "+49 89 445566",
      },
      {
        id: 5,
        price: "(RENTAL) 600 EUR",
        location: "Dingolfing, Bavaria",
        address: "Parkstraße 20, 94469 Dingolfing, Germany",
        description: "Modern townhouse with garden.",
        descriptionPdf: "/pdfs/listing5-description.pdf",
        migrationProofPdf: "/pdfs/listing5-proof.pdf",
        coordinates: { lat: 48.2660, lng: 12.5350 },
        email: "contact5@example.com",
        phone: "+49 89 778899",
      },
    ]);
  }, []);

  // Initialize filtered listings
  useEffect(() => {
    setFilteredListings(listings);
  }, [listings]);

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      // If search query is empty, show all listings
      setFilteredListings(listings);
    } else {
      // Filter listings based on location
      const filtered = listings.filter((listing) =>
        listing.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredListings(filtered);
    }
  }, [searchQuery, listings]);

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

      // Set success dialog message
      setDialogMessage("Withdrawal successful, your RWRD has been reserved!");
      setOpenDialog(true);
    } catch (error) {
      console.error("Withdrawal transaction failed:", error);
      setWithdrawLogs(`Withdrawal transaction failed: ${error.message}`);

      // Set failure dialog message
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
    <Container maxWidth="lg" sx={{ marginTop: "40px", marginBottom: "40px" }}>
      <WalletModalProvider>
        <Grid container justifyContent="flex-end">
          <WalletMultiButton />
        </Grid>
      </WalletModalProvider>

      {wallet.connected ? (
        <>
          {/* Migrate Advert Section */}
          <Card variant="outlined" sx={{ marginTop: "30px" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Migrate Advert
              </Typography>
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={4}>
                  {/* PDF Upload */}
                  <Grid item xs={12} sm={6}>
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

                  {/* Price Input */}
                  <Grid item xs={12} sm={6}>
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      // type="number"
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      // required
                      // inputProps={{ min: "0", step: "0.01" }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      // type="number"
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      // required
                      // inputProps={{ min: "0", step: "0.01" }}
                    />
                  </Grid>
                  {/* Selected Location */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={`Lat: ${latitude}, Lng: ${longitude}`}
                      label="Selected Location"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>

                  {/* Map */}
                  <Grid item xs={12}>
                    <Paper elevation={3} sx={{ height: "400px", borderRadius: "12px", overflow: "hidden" }}>
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
                    </Paper>
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disableElevation
                      size="large"
                    >
                      Submit
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Transaction Logs */}
              {logs && (
                <Box sx={{ marginTop: "20px" }}>
                  <Typography variant="body1" color="text.primary">
                    <strong>Status:</strong> {logs}
                  </Typography>
                </Box>
              )}
              {txSignature && (
                <Box sx={{ marginTop: "10px" }}>
                  <Typography variant="body1" color="text.primary">
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
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Withdraw Deposit Section */}
          {txSignature && (
            <Card variant="outlined" sx={{ marginTop: "30px" }}>
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
                  sx={{ marginBottom: "10px" }}
                >
                  Withdraw
                </Button>
                {withdrawLogs && (
                  <Typography variant="body1" color="text.primary">
                    {withdrawLogs}
                  </Typography>
                )}
                {withdrawTxSignature && (
                  <Typography variant="body1" color="text.primary">
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
      ) : null}

      {/* Search Bar for Listings */}
      <Card variant="outlined" sx={{ marginTop: "30px", padding: "20px" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Listings
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter location (e.g., Munich, Berlin)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {/* Note: The search functionality is mocked and filters the displayed listings based on user input */}
          <Typography variant="body2" sx={{ marginTop: "10px", color: grey[600] }}>
            {searchQuery.trim() === ""
              ? "Showing all listings."
              : `Showing listings for "${searchQuery}".`}
          </Typography>
        </CardContent>
      </Card>

      {/* Active Listings Section */}
      <Card variant="outlined" sx={{ marginTop: "40px" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Listings {searchQuery.trim() !== "" && `in "${searchQuery}"`}
          </Typography>
          {filteredListings.length > 0 ? (
            <List>
              {filteredListings.map((listing) => (
                <React.Fragment key={listing.id}>
                  <ListItem alignItems="flex-start" disableGutters>
                    <Grid container spacing={2}>
                      {/* Listing Details */}
                      <Grid item xs={12} md={6}>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" color="text.primary">
                              {listing.location} - {listing.price}
                            </Typography>
                          }
                          secondary={
                            <div>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="div" // Changed to prevent <p> nesting
                              >
                                <strong>Address:</strong> {listing.address}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ marginTop: "5px" }}
                                component="div" // Changed to prevent <p> nesting
                              >
                                {listing.description}
                              </Typography>
                              {/* Contact Information */}
                              <Box sx={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ marginLeft: "5px", marginRight: "15px" }}
                                  component="span" // Changed to prevent <p> nesting
                                >
                                  {listing.email}
                                </Typography>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ marginLeft: "5px" }}
                                  component="span" // Changed to prevent <p> nesting
                                >
                                  {listing.phone}
                                </Typography>
                              </Box>
                            </div>
                          }
                        />
                        {/* Download Buttons */}
                        <Box sx={{ marginTop: "10px" }}>
                          <IconButton
                            aria-label="download description"
                            href={listing.descriptionPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="primary"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                      {/* Listing Map */}
                      <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ height: "200px", borderRadius: "12px", overflow: "hidden" }}>
                          <MapContainer
                            center={listing.coordinates}
                            zoom={15}
                            style={{ height: "100%", width: "100%" }}
                            dragging={false}
                            zoomControl={false}
                            doubleClickZoom={false}
                            scrollWheelZoom={false}
                            touchZoom={false}
                          >
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={listing.coordinates}></Marker>
                          </MapContainer>
                        </Paper>
                      </Grid>
                    </Grid>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No listings found for "{searchQuery}".
            </Typography>
          )}
          <Typography variant="body2" sx={{ marginTop: "15px", color: grey[600] }}>
            {searchQuery.trim() === ""
              ? "Currently showing listings for Dingolfing. Search for listings in other locations soon!"
              : "Currently showing filtered results based on your search."}
          </Typography>
        </CardContent>
      </Card>

      {/* Withdrawal Status Dialog */}
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

      {/* Show Listings Even When Wallet is Not Connected */}
      {/* The "Active Listings" section is already outside the wallet.connected condition */}
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
