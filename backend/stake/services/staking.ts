import { Connection, PublicKey } from "@solana/web3.js";
import { BinaryReader, BinaryWriter, deserializeUnchecked } from "borsh";
import base58 from "bs58";
import BN from 'bn.js';

type KeyState = number;
type StringPublicKey = string;

(BinaryReader.prototype as any).readKeyState = function () {
    const reader = this as unknown as BinaryReader;
    const value = reader.readU8();
    return value as KeyState;
};

(BinaryWriter.prototype as any).writeKeyState = function (value: KeyState) {
    const writer = this as unknown as BinaryWriter;
    writer.writeU8(value);
};

(BinaryReader.prototype as any).readPubkeyAsString = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return base58.encode(array) as StringPublicKey;
};

(BinaryWriter.prototype as any).writePubkeyAsString = function (value: StringPublicKey) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(base58.decode(value));
};

export default class Staking {
    private connection: Connection;
    private programId: PublicKey;
    private stakingConfigAccount: PublicKey;

    constructor(){
        this.connection = new Connection("https://ssc-dao.genesysgo.net/", 'confirmed');
        this.programId = new PublicKey('8LBB23ycaZYBuEDu9R9i8QYfprq1sFxLC4vuFmXkPtKh');
        this.stakingConfigAccount = new PublicKey('CbPXE17MVuhKNT4AaPxemKyCs1r6evkeqF9mgmsBY8Kg');
    }
    
    public async getAllAccounts() {
        const programAccounts = await this.connection.getProgramAccounts(this.programId, {
            filters: [
                {
                    memcmp: {
                        offset: 0,
                        bytes: base58.encode([4]),
                    }
                },
                {
                    memcmp: {
                        offset: 1 + 32,
                        bytes: this.stakingConfigAccount.toBase58(),
                    }
                }
            ]
        });
        return programAccounts.map(programAccount => {
            return this.deserializeVault(programAccount.pubkey, programAccount.account.data);
        });
    }

    private deserializeVault(accountKey: PublicKey, data: Buffer) {
        const state = deserializeUnchecked(
            STAKING_SCHEMA,
            VaultState,
            data
        );
        return new VaultStateResponse(accountKey, state);
    }
}

class VaultState {
	key: KeyState; // 1
	authority: StringPublicKey; // 32
	stake_config: StringPublicKey; // 32
	reward_config: StringPublicKey; // 32
	nft_token_account: StringPublicKey; // 32
	mint_account: StringPublicKey; // 32
	lock_up_period: number; // 1
	last_reward_timestamp: BN; // 8
	unlock_timestamp: BN; // 8
	tokens_paid: BN; // 8

	constructor(args: {
		key: KeyState,
		authority: StringPublicKey,
		stake_config: StringPublicKey,
		reward_config: StringPublicKey,
		nft_token_account: StringPublicKey,
		mint_account: StringPublicKey,
		lock_up_period: number,
		last_reward_timestamp: BN,
		unlock_timestamp: BN,
		tokens_paid: BN,
	}) {
		this.key = args.key;
		this.authority = args.authority;
		this.stake_config = args.stake_config;
		this.reward_config = args.reward_config;
		this.nft_token_account = args.nft_token_account;
		this.mint_account = args.mint_account;
		this.lock_up_period = args.lock_up_period;
		this.last_reward_timestamp = args.last_reward_timestamp;
		this.unlock_timestamp = args.unlock_timestamp;
		this.tokens_paid = args.tokens_paid;
	}
}

class VaultStateResponse {
	account_key: StringPublicKey;
	authority: StringPublicKey;
	stake_config: StringPublicKey;
	reward_config: StringPublicKey;
	nft_token_account: StringPublicKey;
	mint_account: StringPublicKey;
	lock_up_period: number;
	last_reward_timestamp: number;
	unlock_timestamp: number;
	tokens_paid: number;

	constructor(accountKey: PublicKey, vaultState: VaultState) {
		this.account_key = accountKey.toBase58();
		this.authority = vaultState.authority;
		this.stake_config = vaultState.stake_config;
		this.reward_config = vaultState.reward_config;
		this.nft_token_account = vaultState.nft_token_account;
		this.mint_account = vaultState.mint_account;
		this.lock_up_period = vaultState.lock_up_period;
		this.last_reward_timestamp = vaultState.last_reward_timestamp.toNumber();
		this.unlock_timestamp = vaultState.unlock_timestamp.toNumber();
		this.tokens_paid = vaultState.tokens_paid.toNumber();
	}
}

const STAKING_SCHEMA = new Map<any, any>([
	[
		VaultState,
		{
			kind: 'struct',
			fields: [
				['key', 'keyState'],
				['authority', 'pubkeyAsString'],
				['stake_config', 'pubkeyAsString'],
				['reward_config', 'pubkeyAsString'],
				['nft_token_account', 'pubkeyAsString'],
				['mint_account', 'pubkeyAsString'],
				['lock_up_period', 'u8'],
				['last_reward_timestamp', 'u64'],
				['unlock_timestamp', 'u64'],
				['tokens_paid', 'u64'],
			],
		},
	],
]);
