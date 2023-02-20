import Staking from "./services/staking";
import fs from "fs";

async function main() {
	try {
		const staking = new Staking();

		const accounts = (await staking.getAllAccounts()).map((x) => {
			return {
				owner: x.authority,
				mint: x.mint_account,
			};
		});

		if (accounts.length == 0) {
			console.log("Unable to find any staked accounts!");
			return;
		}

		fs.writeFileSync(
			"./stakedAccounts.json",
			JSON.stringify(accounts, null, 2)
		);
		console.log(
			`Found ${accounts.length} staked accounts! Data written to "./stakedAccounts.json"'.`
		);
	} catch (err) {
		console.log(err);
	}
}
main();
