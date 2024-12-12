import { ethers, isError } from "ethers";
import dotenv from "dotenv";
import axios, { AxiosError } from "axios";
import type { NodeInfo } from "./response";
import type { Fragments } from "./responseFragment";
import { exit } from "process";

dotenv.config();

const {
  PROVIDER_URL: providerUrl,
  PRIVATE_KEY: privateKey,
  CONTRACT_ADDRESS: contractAddress,
  CONTRACT_RIZ: contractAddressRiz,
} = process.env;
if (!providerUrl || !privateKey || !contractAddress || !contractAddressRiz) {
  throw new Error(
    "Please set PROVIDER_URL, PRIVATE_KEY, CONTRACT_ADDRESS in the .env file."
  );
}

const provider = new ethers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const contractABI = [
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const contract = new ethers.Contract(contractAddress, contractABI, wallet);
const contractRiz = new ethers.Contract(
  contractAddressRiz,
  contractABI,
  wallet
);

async function initiateSignatureRequest(): Promise<object> {
  try {
    const currentTimestamp = Math.floor(Date.now());
    const dataSign = `Sign in to Rivalz with OTP: ${currentTimestamp}`;
    const signature = await wallet.signMessage(dataSign);
    return {
      address: wallet.address,
      signature,
      dataSign,
      referralId: "",
    };
  } catch (error) {
    console.error("Error signing data:", error);
    throw error;
  }
}

async function checkClaimAble() {
  try {
    const data = `0x89885049000000000000000000000000${wallet.address.replace(
      "0x",
      ""
    )}`;
    const response = await provider.call({
      from: `0x24edfad36015420a84573684644f6dc74f0ba8c5`,
      to: contractAddress,
      data,
    });
    const fragmentCount = parseInt(response);
    console.log({ fragmentCount });
    return fragmentCount;
  } catch (error) {
    throw error;
  }
}

async function loginWithWallet(data: object): Promise<string> {
  try {
    const url = `https://be.rivalz.ai/api-v1/auth/login-with-wallet`;
    const headers = {
      accept: "application/json",
      authorization: "Bearer null",
      "content-type": "application/json; charset=UTF-8",
    };
    const response = await axios.post(url, JSON.stringify(data), { headers });
    return response.data.data.accessToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error:", error.message);
    }
    throw error;
  }
}

async function getScore(): Promise<Fragments> {
  try {
    const url = `https://api.rivalz.ai/fragment/v1/fragment/collection/${wallet.address}`;
    const headers = {
      accept: "application/json",
    };
    const response = await axios.get(url, { headers });
    return response.data as Fragments;
  } catch (error) {
    throw error;
  }
}

async function findByWalletAddress(token: string): Promise<NodeInfo> {
  const url = `https://be.rivalz.ai/api-v1/orbit-db/find-by-wallet-address/${wallet.address}`;
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${token}`,
  };
  try {
    const response = await axios.get(url, { headers });
    return response.data as NodeInfo;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error:", error.message);
    }
    throw error;
  }
}

function getRandomNonce(min: number, max: number): string {
  const nonce = Math.floor(Math.random() * (max - min + 1)) + min;
  return nonce.toString().padStart(2, "0"); // Ensures the nonce is always two digits
}

async function getRiz() {
  try {
    console.log(`add Riz for claim...`);
    const tx = await contractRiz.claim();
    console.log("Transaction hash:", tx.hash);
    const tx_complete = await tx.wait();
    console.log("Transaction confirmed:", tx_complete.hash);
  } catch (error) {}
}

async function callClaim() {
  try {
    console.log("Calling claim function...");
    const tx = await contract.claim();
    console.log("Transaction hash:", tx.hash);
    const tx_complete = await tx.wait();
    console.log("Transaction confirmed:", tx_complete.hash);
    return tx_complete.hash;
  } catch (error) {
    throw error;
  }
}

async function executeProcess() {
  try {
    while ((await checkClaimAble()) > 0) {
      try {
        const tx_hash = await callClaim();
      } catch (error) {
        console.error("Error calling claim function:");
        if (isError(error, "CALL_EXCEPTION")) {
          console.log({ error });
        }
      }
    }
  } catch (error) {
    console.log(error);
    if (isError(error, "SERVER_ERROR")) {
      exit(1);
    }
  }
}

executeProcess();
