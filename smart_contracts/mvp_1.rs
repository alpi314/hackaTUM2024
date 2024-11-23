// our first anchor rust solana program, functional yet has room for improvement
use anchor_lang::prelude::*;


declare_id!("Egwieoi2FRVMJG9bh6pcggEDGQrBKGy1cHLZPo2hU7zk"); // Replace with your actual program ID


#[program]
pub mod your_program_name {
    use super::*;


    pub fn initialize(ctx: Context<Initialize>, reward_mint: Pubkey) -> Result<()> {
        let dao_account = &mut ctx.accounts.dao_account;
        dao_account.reward_mint = reward_mint;
        dao_account.ok_votes = 0;
        dao_account.not_votes = 0;
        msg!("DAO account initialized successfully.");
        Ok(())
    }


    pub fn submit_data(
        ctx: Context<SubmitData>,
        pdf_hash: String,
        latitude: String,
        longitude: String,
        price: u64,
    ) -> Result<()> {
        // Input validation
        if pdf_hash.is_empty() || latitude.is_empty() || longitude.is_empty() {
            msg!("Error: One or more fields are empty.");
            return Err(ProgramError::InvalidArgument.into());
        }


        let data_account = &mut ctx.accounts.data_account;
        data_account.pdf_hash = pdf_hash;
        data_account.latitude = latitude;
        data_account.longitude = longitude;
        data_account.price = price;
        data_account.depositor = *ctx.accounts.user.key;


        msg!("Data submitted successfully by {}", ctx.accounts.user.key);
        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = DAOAccount::LEN)]
    pub dao_account: Account<'info, DAOAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SubmitData<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(init, payer = user, space = DataAccount::LEN)]
    pub data_account: Account<'info, DataAccount>,
    pub system_program: Program<'info, System>,
}


#[account]
pub struct DAOAccount {
    pub reward_mint: Pubkey,
    pub ok_votes: u64,
    pub not_votes: u64,
}


impl DAOAccount {
    const LEN: usize = 8 + 32 + 8 + 8; // Discriminator + Pubkey + u64 + u64
}


#[account]
pub struct DataAccount {
    pub pdf_hash: String,
    pub latitude: String,
    pub longitude: String,
    pub price: u64,
    pub depositor: Pubkey,
}


impl DataAccount {
    // Maximum sizes for the strings
    const MAX_PDF_HASH_LEN: usize = 64;
    const MAX_LATITUDE_LEN: usize = 32;
    const MAX_LONGITUDE_LEN: usize = 32;


    const LEN: usize = 8 + // Discriminator
        4 + Self::MAX_PDF_HASH_LEN + // pdf_hash
        4 + Self::MAX_LATITUDE_LEN + // latitude
        4 + Self::MAX_LONGITUDE_LEN + // longitude
        8 + // price
        32; // depositor
}
