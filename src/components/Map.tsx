import React, { useState, useEffect } from "react";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import fetchContractData from "../util/genNFTData";
import styled from "styled-components";

type Attribute = {
  trait_type: string;
  value: string;
};

type Stop = {
  position: LatLngTuple;
  name: string;
  owner: string;
  description: string;
  imageURL: string;
  attributes: Attribute[]; // 新しい属性情報を追加
};

const RADIUS_KM = 1;
const DEGREE_PER_KM = 0.009;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #000;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  font-weight: bold;
`;

// Don't forget to include the keyframes somewhere global, like in a CSS file.

const offsetFixedPositionWithin1km = (
  position: LatLngTuple,
  index: number,
  total: number
): LatLngTuple => {
  const angleInterval = (2 * Math.PI) / total;
  const fixedAngle = angleInterval * index;
  const fixedRadius = (DEGREE_PER_KM * RADIUS_KM) / 2; // 1kmの半径内で固定

  return [
    position[0] + fixedRadius * Math.sin(fixedAngle),
    position[1] + fixedRadius * Math.cos(fixedAngle),
  ];
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
    <p>Description: {stop.description}</p>
  </div>
);

const truncateAddress = (address: string, startLength = 6, endLength = 6) => {
  return `${address.substring(0, startLength)}...${address.substring(
    address.length - endLength
  )}`;
};

const Map = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNftData = async () => {
      const ipfsDataArray = await fetchContractData();
      const jsonArray = ipfsDataArray.map((jsonString) =>
        JSON.parse(jsonString)
      );
      console.log(jsonArray);

      const rawStops: Stop[] = jsonArray.map((data: any) => ({
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
        owner: data.Owner,
        description: data.description,
        imageURL: data.image,
        attributes: data.attributes,
      }));

      // Adjust stops with potential overlaps
      const adjustedStops = rawStops.map((stop, idx, allStops) => {
        const duplicatesBeforeThis = allStops
          .slice(0, idx)
          .filter(
            (s) =>
              s.position[0] === stop.position[0] &&
              s.position[1] === stop.position[1]
          );

        const totalDuplicates = allStops.filter(
          (s) =>
            s.position[0] === stop.position[0] &&
            s.position[1] === stop.position[1]
        ).length;

        if (totalDuplicates > 1) {
          return {
            ...stop,
            position: offsetFixedPositionWithin1km(
              stop.position,
              duplicatesBeforeThis.length,
              totalDuplicates
            ),
          };
        }
        return stop;
      });

      setStops(adjustedStops);
      setLoading(false);
    };

    fetchNftData();
  }, []);

  if (loading) {
    return (
      // @ts-ignore
      <LoadingContainer>
        <LoadingSpinner />
        <div>Loading...</div>
      </LoadingContainer>
    );
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
      {stops.map((stop, idx) => {
        return (
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
              <p>Owner: {stop.owner}</p>
              <p>Description: {stop.description}</p>
              <ul>
                {stop.attributes.map((attr, index) => (
                  <li key={index}>
                    {attr.trait_type === "Previous_wallet_address" ||
                    attr.trait_type === "Previous_contract_address"
                      ? `${attr.trait_type}: ${truncateAddress(attr.value)}`
                      : `${attr.trait_type}: ${attr.value}`}
                  </li>
                ))}
              </ul>
            </Popup>
          </Marker>
        );
      })}
      {selectedStop && (
        <SelectedStopInfo stop={selectedStop} key={selectedStop.name} />
      )}
    </MapContainer>
  );
};

export default Map;
