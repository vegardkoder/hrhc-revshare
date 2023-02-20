import * as web3 from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import base58 from 'bs58';

async function main() {
    const wallet = "3RdxEfnWTfCRtNKTmm9K6CnM8u6xs5j7rPx5B63wnRJm";
    let connection = new web3.Connection("https://lively-cool-hill.solana-mainnet.quiknode.pro/c9cdc92c17469a3cc71f79fbbdbf9f6fa6d973e8/", 'confirmed');

    const test = base58.encode(4);
    console.log(test);

    const accounts = await connection.getParsedProgramAccounts(
        new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        {
          filters: [
            {
              memcmp: {
                offset: base58.encode([4]),
                bytes: wallet,
              }, // number of bytes
            },
            {
              memcmp: {
                offset: 1 + 32, // number of bytes
                bytes: wallet, // base58 encoded string
              },
            },
            /*{
              dataSize: 164,
            },*/
          ],
        }
    );

    console.log(accounts[0].account.data["parsed"]);
}
main();

// CRAXDrhaB5mopeuPUAtPoEygJqhZT6omyL3fd7WshHxE