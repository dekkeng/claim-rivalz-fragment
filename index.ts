import { ethers } from "ethers";
import dotenv from "dotenv";
import Web3 from "web3";
import axios, { AxiosError } from "axios";
import type { Root } from "./response";

dotenv.config();

const {
  PROVIDER_URL: providerUrl,
  PRIVATE_KEY: privateKey,
  CONTRACT_ADDRESS: contractAddress,
} = process.env;
if (!providerUrl || !privateKey || !contractAddress) {
  throw new Error(
    "Please set PROVIDER_URL, PRIVATE_KEY, CONTRACT_ADDRESS in the .env file."
  );
}

const provider = new ethers.JsonRpcProvider(providerUrl);
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const wallet = new ethers.Wallet(privateKey, provider);
const contractABI = [
  {
    inputs: [],
    name: "canClaim",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

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

async function canClaim() {
  try {
    console.log("Checking if a claim is allowed...");
    return await contract.canClaim();
  } catch (error) {
    console.error("Error checking claim status:", error);
    return false;
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

async function findByWalletAddress(token: string): Promise<Root> {
  const url = `https://be.rivalz.ai/api-v1/orbit-db/find-by-wallet-address/${wallet.address}`;
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${token}`,
  };
  try {
    const response = await axios.get(url, { headers });
    return response.data as Root;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error:", error.message);
    }
    throw error;
  }
}

async function callClaim() {
  try {
    const allowed = await canClaim();
    if (!allowed) {
      console.log("Claim is not allowed at the moment.");
      return;
    }

    console.log("Calling claim function...");
    const tx = await contract.claim();
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed:", tx);
  } catch (error) {
    console.error("Error calling claim function:", error);
  }
}

//callClaim();
try {
  const params = await initiateSignatureRequest();
  const accessToken = await loginWithWallet(params);
  const response = await findByWalletAddress(accessToken);
  console.log(response);
} catch (error) {
  console.error("Error during the process:", error.message);
}
