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

const WalletMultiButton = dynamic(() => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton), { ssr: false });
const WalletModalProvider = dynamic(() => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletModalProvider), { ssr: false });
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
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const wallets = [new PhantomWalletAdapter()];
const programID = new PublicKey("48zQM2WJcVtJYyv2gf2PqsCYawgFkEW9ZqrT61DTAZ7J");
const network = "https://devnet.helius-rpc.com/?api-key=ec39cc38-e55f-411b-98b1-019788078549";
const commitment = "processed";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
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
        price: "180,000 EUR",
        address: "Bahnhofstraße 15, Dingolfing, Bavaria",
        description: "Beautiful home with spacious garden and nearby amenities.",
        lat: 48.6391,
        lng: 12.4934,
      },
      {
        id: 2,
        price: "250,000 EUR",
        address: "Marktplatz 10, Dingolfing, Bavaria",
        description: "Prime location in the city center, ideal for families.",
        lat: 48.6418,
        lng: 12.5007,
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

  const downloadProof = (listingId) => {
    alert(`Downloading description and proof for listing ${listingId}`);
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
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <WalletModalProvider>
        <WalletMultiButton />
      </WalletModalProvider>

      {wallet.connected ? (
        <Card variant="outlined" style={{ marginTop: "20px" }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Migrate Advert
            </Typography>
            <form>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="file"
                    label="Upload Description & Proof of Migration"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleFileUpload}
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
                  <div style={{ height: "400px", width: "100%", marginTop: "10px" }}>
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
                  />
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Typography variant="body1" style={{ marginTop: "20px" }}>
          Please connect your wallet to migrate a new advert.
        </Typography>
      )}

      <Card variant="outlined" style={{ marginTop: "20px" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Listings in Dingolfing
          </Typography>
          {listings.map((listing) => (
            <Card variant="outlined" style={{ marginBottom: "15px" }} key={listing.id}>
              <CardContent>
                <Typography variant="h6">{listing.address}</Typography>
                <Typography variant="body1">
                  <strong>Price:</strong> {listing.price}
                </Typography>
                <Typography variant="body2">{listing.description}</Typography>
                <div style={{ height: "200px", width: "100%", marginTop: "10px" }}>
                  <MapContainer
                    center={[listing.lat, listing.lng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[listing.lat, listing.lng]} />
                  </MapContainer>
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ marginTop: "10px" }}
                  onClick={() => downloadProof(listing.id)}
                >
                  Download Description & Proof
                </Button>
              </CardContent>
            </Card>
          ))}
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
