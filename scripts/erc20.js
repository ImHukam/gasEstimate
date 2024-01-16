const { ethers, providers } = require("ethers");
const { Wallet } = require("@ethersproject/wallet");
const sampleTokenData = require("../SampleToken.json");
require("dotenv").config();

async function sampleTokenTransfer() {
  // get private key from env
  const privateKey = process.env.PRIVATE_KEY;
   // get contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;

  // initialize provider
//   const provider = new providers.InfuraProvider(
//     "maticmum",      // "maticmum" for mumbai testnet
//     process.env.INFURA_PROJECT_KEY
//   );

const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com")
// const provider = new ethers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com") //for latest ethers version

  // initialize signer
  const signer = new Wallet(privateKey, provider);
  // const signer = new ethers.Wallet(privateKey, provider)

  // fetch signer nonce
  const nonce = await provider.getTransactionCount(signer.address);
  console.log("nonce: ", nonce);

  // initialize contract instance
  const sampleToken_ContractInstance = new ethers.Contract(
    contractAddress,
    sampleTokenData.abi,
    signer
  );

  // use signer to interact with contract instance
  const sampleToken_Contract = sampleToken_ContractInstance.connect(signer);

  // fetch "fast" gas data from polygon gas station network
  const data = await fetch("https://gasstation-testnet.polygon.technology/v2");
  // for mumbai testnet "https://gasstation-testnet.polygon.technology/v2"
  const dataJson = await data.json();
  const gas = dataJson["fast"];

  // convert priority fee and max fee from GWEI to WEI
  const priority = Math.trunc(gas.maxPriorityFee * 10 ** 9);
  const max = Math.trunc(gas.maxFee * 10 ** 9);
  console.log("using gasData", priority.toString(), max.toString());
  const maxFeePerGas = max.toString()
  const maxPriorityFeePerGas = priority.toString()
  console.log("maxFeePerGas: ", maxFeePerGas)
  console.log("maxPriorityFeePerGas: ", maxPriorityFeePerGas)

  // estimate gas for the transaction with fetched nonce and maxFee and maxPriorityFee
  const estimatedGas = await sampleToken_Contract.estimateGas.transfer(
    process.env.SENDER_ADDRESS,
    100,
    {
      nonce: nonce,
    //   gasLimit: 14_999_999,
    //   maxFeePerGas: maxFeePerGas,
    //   maxPriorityFeePerGas: maxPriorityFeePerGas,
    }
  );
  console.log('estimatedGas: ', estimatedGas.toString());

  // send the actual transaction with estimated gas, nonce and maxFee and maxPriorityFee
  const response = await sampleToken_Contract.transfer(
    process.env.RECEIVER_ADDRESS,
    process.env.TOKEN_AMOUNT_TO_TRANSFER_IN_WEI,
    {
      nonce: nonce,
    //   gasLimit: estimatedGas,
    //   maxFeePerGas: maxFeePerGas,
    //   maxPriorityFeePerGas: maxPriorityFeePerGas,
    }
  );
  await response.wait();
  console.log('tx hash: ',response.hash);
}

sampleTokenTransfer();
