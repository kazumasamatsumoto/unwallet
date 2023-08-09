import React, { useState, useEffect } from "react";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import fetchContractData from "../util/genNFTData";

// Data structure and constants related to the map
type Stop = {
  position: LatLngTuple;
  name: string;
  description: string;
  imageURL: string;
};

const moveIcon = new L.Icon({
  iconUrl: "/pin_drop.png",
  iconRetinaUrl: "/pin_drop.png",
  iconSize: [40, 40],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const SelectedStopInfo: React.FC<{ stop: Stop; key: any }> = ({ stop }) => (
  <div style={{ position: "absolute", bottom: 10, right: 10 }}>
    <h2>Selected Stop: {stop.name}</h2>
    <img
      src={stop.imageURL}
      alt={stop.name}
      style={{ width: "100%", height: "auto" }}
    />
    <p>description: {stop.description}</p>
  </div>
);

const Map = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNftData = async () => {
      const ipfsDataArray = await fetchContractData();
      console.log(ipfsDataArray);
      console.log(typeof ipfsDataArray);
      const jsonArray = ipfsDataArray.map((jsonString) =>
        JSON.parse(jsonString)
      );

      // Convert jsonArray to Stop[]
      const convertedStops: Stop[] = jsonArray.map((data: any) => ({
        position: [
          parseFloat(
            data.attributes.find(
              (attr: any) => attr.trait_type === "PositionX_string"
            ).value
          ),
          parseFloat(
            data.attributes.find(
              (attr: any) => attr.trait_type === "PositionY_string"
            ).value
          ),
        ],
        name: data.name,
        description: data.description,
        imageURL: data.image,
      }));

      setStops(convertedStops); // Update stops state with the converted data
      setLoading(false); // End loading
    };

    fetchNftData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <MapContainer
      center={stops[0].position}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stops.map((stop, idx) => (
        <Marker
          position={stop.position}
          key={idx}
          icon={moveIcon}
          eventHandlers={{
            click: () => {
              setSelectedStop(stop);
            },
          }}
        >
          <Popup>
            <h2>{`${idx + 1}. ${stop.name}`}</h2>
            <img
              src={stop.imageURL}
              alt={stop.name}
              style={{ width: "100%", height: "auto" }}
            />
            <p>Description: {stop.description}</p>
          </Popup>
        </Marker>
      ))}
      {selectedStop && (
        <SelectedStopInfo stop={selectedStop} key={selectedStop.name} />
      )}
    </MapContainer>
  );
};

export default Map;
