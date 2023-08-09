import fetch from "node-fetch";
import { ABI } from "../const/ABI";
const Web3 = require("web3");

const contractAddress = "0x68Ab0531bF0932ece095797d8E62617e2C234C80";
const web3 = new Web3(
  new Web3.providers.HttpProvider("https://rpc-mainnet.maticvigil.com")
);
const contract = new web3.eth.Contract(ABI, contractAddress);

async function getContractData(): Promise<string[]> {
  const uris: string[] = [];
  try {
    const tokenCounter = await contract.methods.totalSupply().call();
    for (let i = 0; i < tokenCounter; i++) {
      const uri = await contract.methods.tokenURI(i).call();
      uris.push(uri);
    }
    return uris;
  } catch (error) {
    console.error("Error reading data from contract:", error);
    return [];
  }
}

async function fetchData(uris: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const uri of uris) {
    try {
      const response = await fetch(uri);
      const data = await response.text();
      results.push(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
  return results;
}

async function main(): Promise<string[]> {
  const uris = await getContractData();
  if (uris.length > 0) {
    return await fetchData(uris);
  }
  return [];
}

export default main;
