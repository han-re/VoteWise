import asyncio
import datetime
import hashlib
import json
import os

import base58
from dotenv import load_dotenv
from solana.rpc.api import Client
from solders.keypair import Keypair

load_dotenv()

connection = Client("https://api.devnet.solana.com")
_raw_key = os.getenv("SOLANA_PRIVATE_KEY", "")
wallet = Keypair.from_bytes(base58.b58decode(_raw_key)) if _raw_key else None


def hash_profile(data: dict) -> str:
    canonical = json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


def _send_memo(profile_hash: str) -> str:
    from solders.instruction import AccountMeta, Instruction
    from solders.message import Message
    from solders.pubkey import Pubkey
    from solders.transaction import Transaction

    if not wallet:
        raise RuntimeError("SOLANA_PRIVATE_KEY is not configured")

    memo_program = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")
    memo_ix = Instruction(
        program_id=memo_program,
        accounts=[AccountMeta(pubkey=wallet.pubkey(), is_signer=True, is_writable=False)],
        data=profile_hash.encode("utf-8"),
    )
    blockhash_resp = connection.get_latest_blockhash()
    recent_blockhash = blockhash_resp.value.blockhash
    msg = Message.new_with_blockhash([memo_ix], wallet.pubkey(), recent_blockhash)
    tx = Transaction([wallet], msg, recent_blockhash)
    result = connection.send_transaction(tx)
    return str(result.value)


def _chain_record(politician_id: str, profile_hash: str, tx_signature: str, verified_at: str) -> dict:
    return {
        "politician_id": politician_id,
        "tx_signature": tx_signature,
        "profile_hash": profile_hash,
        "explorer_url": f"https://explorer.solana.com/tx/{tx_signature}?cluster=devnet",
        "verified_at": verified_at,
        "network": "devnet",
        "fallback": False,
    }


async def verify_profile_on_chain(politician_id: str, profile_data: dict, db) -> dict:
    profile_hash = hash_profile(profile_data)
    now = datetime.datetime.utcnow().isoformat()

    existing = None
    try:
        existing = await db.chain_state.find_one({"politician_id": politician_id})
    except Exception:
        pass

    # If the hash is unchanged and already backed by a real transaction, do not
    # spend another devnet tx. Old demo/fallback rows are deliberately upgraded.
    if existing and existing.get("profile_hash") == profile_hash and not existing.get("fallback"):
        existing.pop("_id", None)
        return existing

    if not wallet:
        raise RuntimeError("SOLANA_PRIVATE_KEY is not configured; refusing to create a demo chain record.")

    upgraded_previous = None
    if existing and existing.get("fallback") and existing.get("profile_hash") != profile_hash:
        previous_hash = existing.get("profile_hash")
        if previous_hash:
            previous_tx = await asyncio.to_thread(_send_memo, previous_hash)
            upgraded_previous = {
                "tx_signature": previous_tx,
                "profile_hash": previous_hash,
                "explorer_url": f"https://explorer.solana.com/tx/{previous_tx}?cluster=devnet",
                "verified_at": existing.get("verified_at"),
                "replaced_at": now,
            }

    tx_signature = await asyncio.to_thread(_send_memo, profile_hash)
    record = _chain_record(politician_id, profile_hash, tx_signature, now)

    try:
        if existing and existing.get("profile_hash") != profile_hash:
            changelog_entry = upgraded_previous or {
                "tx_signature": existing.get("tx_signature"),
                "profile_hash": existing.get("profile_hash"),
                "explorer_url": existing.get("explorer_url"),
                "verified_at": existing.get("verified_at"),
                "replaced_at": now,
            }
            await db.chain_state.update_one(
                {"politician_id": politician_id},
                {"$push": {"changelog": changelog_entry}},
            )

        await db.chain_state.update_one(
            {"politician_id": politician_id},
            {"$set": record},
            upsert=True,
        )
    except Exception as db_err:
        raise RuntimeError(f"Solana transaction succeeded but DB write failed: {db_err}") from db_err

    return record
