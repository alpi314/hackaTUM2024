use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("Egwieoi2FRVMJG9bh6pcggEDGQrBKGy1cHLZPo2hU7zk"); // Replace with your actual program ID

#[program]
pub mod your_program_name {
    use super::*;

    pub fn submit_data(
        ctx: Context<SubmitData>,
        pdf_hash: String,
        latitude: String,
        longitude: String,
        price: u64,
        deposit_amount: u64, // Accept deposit_amount as a parameter
    ) -> Result<()> {
        // Input validation
        if pdf_hash.is_empty()  latitude.is_empty()  longitude.is_empty() {
            msg!("Error: One or more fields are empty.");
            return Err(ProgramError::InvalidArgument.into());
        }

        let data_account = &mut ctx.accounts.data_account;
        let clock = Clock::get().unwrap();

        data_account.pdf_hash = pdf_hash;
        data_account.latitude = latitude;
        data_account.longitude = longitude;
        data_account.price = price;
        data_account.depositor = *ctx.accounts.user.key;
        data_account.timestamp = clock.unix_timestamp;
        data_account.deposit_amount = deposit_amount;

        // Transfer lamports from the user to the data_account
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: data_account.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_ctx, deposit_amount)?;

        msg!("Data submitted successfully by {}", ctx.accounts.user.key);
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let data_account = &mut ctx.accounts.data_account;
        let clock = Clock::get().unwrap();
        let current_time = clock.unix_timestamp;

        // Ensure that 10 seconds have passed
        if current_time < data_account.timestamp + 10 {
            msg!("Withdrawal is not yet allowed. Please wait for 10 seconds since submission.");
            return Err(ProgramError::Custom(0).into()); // Use a custom error code
        }

        // Ensure that only the depositor can withdraw
        if data_account.depositor != *ctx.accounts.user.key {
            msg!("Only the original depositor can withdraw the funds.");
            return Err(ProgramError::IllegalOwner.into());
        }

        // Transfer lamports back to the user
        let amount = data_account.deposit_amount;
        **data_account.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .user
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        msg!("Withdrawal of {} lamports successful.", amount);

        // Close the data account to reclaim rent
        data_account.close(ctx.accounts.user.to_account_info())?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SubmitData<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = DataAccount::LEN,
        seeds = [b"data_account", user.key().as_ref()],
        bump,
    )]
    pub data_account: Account<'info, DataAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"data_account", user.key().as_ref()],
        bump,
        close = user
    )]
    pub data_account: Account<'info, DataAccount>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct DataAccount {
    pub pdf_hash: String,
    pub latitude: String,
    pub longitude: String,
    pub price: u64,
    pub depositor: Pubkey,
    pub timestamp: i64,
    pub deposit_amount: u64,
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
            32 + // depositor
            8 + // timestamp
            8; // deposit_amount
    }