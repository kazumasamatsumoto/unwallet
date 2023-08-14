import fetch from "node-fetch";
import { ABI } from "../const/ABI";
const Web3 = require("web3");

const contractAddresses = [
  "0x7553969b6cac46454330c584eeedecd69b422384", // 作品NFTのコントラクトアドレス
  "0x7B45b4cB1f45d9B76CAB2B3628Ba632Cb96Ec8a8", // 卒業NFTのコントラクトアドレス
];

const web3 = new Web3(
  new Web3.providers.HttpProvider("https://rpc-mainnet.maticvigil.com")
);

async function getContractData(
  address: string
): Promise<{ uri: string; owner: string }[]> {
  const data: { uri: string; owner: string }[] = [];
  const contract = new web3.eth.Contract(ABI, address);

  try {
    const tokenCounter = await contract.methods.totalSupply().call();

    for (let i = 0; i < tokenCounter; i++) {
      const uri = await contract.methods.tokenURI(i).call();
      const owner = await contract.methods.ownerOf(i).call();

      data.push({ uri, owner });
    }
  } catch (error) {
    console.error("Error reading data from contract:", error);
  }

  return data;
}

async function fetchData(data: { uri: string, owner: string }[]): Promise<any[]> {
  const results: any[] = [];

  for (const item of data) {
    try {
      const response = await fetch(item.uri);

      if (!response.ok) {
        const errorData = await response.text();
        if (errorData.includes("<Code>NoSuchKey</Code>")) {
          console.warn(`Skipping missing URI: ${item.uri}`);
          continue; // Skip to next iteration
        }
        throw new Error(`Fetch failed for URI ${item.uri} with status ${response.status}`);
      }

      const fetchedData = await response.json();
      fetchedData["Owner"] = item.owner;  // Owner情報を追加

      results.push(JSON.stringify(fetchedData));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return results;
}

async function main(): Promise<string[]> {
  const allData: { uri: string, owner: string }[] = [];
  for (const address of contractAddresses) {
    const dataFromAddress = await getContractData(address);
    allData.push(...dataFromAddress);
  }

  if (allData.length > 0) {
    return await fetchData(allData);
  }
  return [];
}

export default main;
