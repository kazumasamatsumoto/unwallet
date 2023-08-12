import React, { useState, useEffect } from "react";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import fetchContractData from "../util/genNFTData";

type Stop = {
  position: LatLngTuple;
  name: string;
  description: string;
  imageURL: string;
};

const ipfsURLtoHTTP = (ipfsURL: string) => {
  return ipfsURL.replace("ipfs://", "https://ipfs.io/ipfs/");
};

const moveIcon = new L.Icon({
  iconUrl: "/pin_drop.png",
  iconRetinaUrl: "/pin_drop.png",
  iconSize: [40, 40],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const StopsPopup: React.FC<{ stops: Stop[] }> = ({ stops }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const buttonStyle: React.CSSProperties = {
    background: "#007BFF",
    border: "none",
    borderRadius: "5px",
    color: "#FFF",
    padding: "5px 15px",
    margin: "5px",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s ease-in-out",
  };

  const buttonHoverStyle: React.CSSProperties = {
    background: "#0056b3",
  };

  const handleMouseOver = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    Object.assign(event.currentTarget.style, buttonHoverStyle);
  };

  const handleMouseOut = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    Object.assign(event.currentTarget.style, buttonStyle);
  };

  return (
    <div>
      <h2>{stops[currentIdx].name}</h2>
      <img
        src={stops[currentIdx].imageURL}
        alt={stops[currentIdx].name}
        style={{ width: "100%", height: "auto" }}
      />
      <p>Description: {stops[currentIdx].description}</p>
      <button
        style={buttonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={() =>
          setCurrentIdx((prev) => (prev - 1 + stops.length) % stops.length)
        }
        disabled={stops.length <= 1}
      >
        戻る
      </button>
      <button
        style={buttonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={() => setCurrentIdx((prev) => (prev + 1) % stops.length)}
        disabled={stops.length <= 1}
      >
        次へ
      </button>
    </div>
  );
};

const Map = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNftData = async () => {
      const ipfsDataArray = await fetchContractData();
      const jsonArray = ipfsDataArray.map((jsonString) =>
        JSON.parse(jsonString)
      );

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
        imageURL: ipfsURLtoHTTP(data.image),
      }));

      setStops(convertedStops);
      setLoading(false);
    };

    fetchNftData();
  }, []);

  const getStopsAtPosition = (position: LatLngTuple): Stop[] => {
    return stops.filter(
      (stop) =>
        stop.position[0] === position[0] && stop.position[1] === position[1]
    );
  };

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
        <Marker position={stop.position} key={idx} icon={moveIcon}>
          <Popup>
            <StopsPopup stops={getStopsAtPosition(stop.position)} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
