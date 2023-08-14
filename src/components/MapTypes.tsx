import { LatLngTuple } from "leaflet";

export type Attribute = {
  trait_type: string;
  value: string;
};

export type Stop = {
  position: LatLngTuple;
  name: string;
  owner: string;
  description: string;
  imageURL: string;
  attributes: Attribute[]; // 新しい属性情報を追加
};