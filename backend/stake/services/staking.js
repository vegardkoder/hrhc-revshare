"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var web3_js_1 = require("@solana/web3.js");
var borsh_1 = require("borsh");
var bs58_1 = require("bs58");
borsh_1.BinaryReader.prototype.readKeyState = function () {
    var reader = this;
    var value = reader.readU8();
    return value;
};
borsh_1.BinaryWriter.prototype.writeKeyState = function (value) {
    var writer = this;
    writer.writeU8(value);
};
borsh_1.BinaryReader.prototype.readPubkeyAsString = function () {
    var reader = this;
    var array = reader.readFixedArray(32);
    return bs58_1.encode(array);
};
borsh_1.BinaryWriter.prototype.writePubkeyAsString = function (value) {
    var writer = this;
    writer.writeFixedArray(bs58_1.decode(value));
};
var Staking = /** @class */ (function () {
    function Staking() {
        this.connection = new web3_js_1.Connection("https://lively-cool-hill.solana-mainnet.quiknode.pro/c9cdc92c17469a3cc71f79fbbdbf9f6fa6d973e8/", 'confirmed');
        this.programId = new web3_js_1.PublicKey('8LBB23ycaZYBuEDu9R9i8QYfprq1sFxLC4vuFmXkPtKh');
        this.stakingConfigAccount = new web3_js_1.PublicKey('CbPXE17MVuhKNT4AaPxemKyCs1r6evkeqF9mgmsBY8Kg');
    }
    Staking.prototype.getAllAccounts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var programAccounts;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection.getProgramAccounts(this.programId, {
                            filters: [
                                {
                                    memcmp: {
                                        offset: 0,
                                        bytes: bs58_1.encode([4])
                                    }
                                },
                                {
                                    memcmp: {
                                        offset: 1 + 32,
                                        bytes: this.stakingConfigAccount.toBase58()
                                    }
                                }
                            ]
                        })];
                    case 1:
                        programAccounts = _a.sent();
                        return [2 /*return*/, programAccounts.map(function (programAccount) {
                                return _this.deserializeVault(programAccount.pubkey, programAccount.account.data);
                            })];
                }
            });
        });
    };
    Staking.prototype.deserializeVault = function (accountKey, data) {
        var state = (0, borsh_1.deserializeUnchecked)(STAKING_SCHEMA, VaultState, data);
        return new VaultStateResponse(accountKey, state);
    };
    return Staking;
}());
exports["default"] = Staking;
var VaultState = /** @class */ (function () {
    function VaultState(args) {
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
    return VaultState;
}());
var VaultStateResponse = /** @class */ (function () {
    function VaultStateResponse(accountKey, vaultState) {
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
    return VaultStateResponse;
}());
var STAKING_SCHEMA = new Map([
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
            ]
        },
    ],
]);
