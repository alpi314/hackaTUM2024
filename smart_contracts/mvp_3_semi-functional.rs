use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

declare_id!("7thLto3iAVrBx2jzgH7mmQ4Mrit4F94ongnY8xgMFb8d"); // Replace with your actual program ID

#[program]
pub mod your_program_name {
    use super::*;

    pub fn submit_data(
        ctx: Context<SubmitData>,
        pdf_hash: String,
        latitude: String,
        longitude: String,
        price: u64,
        deposit_amount: u64,
    ) -> Result<()> {
        // Input validation
        if pdf_hash.is_empty() || latitude.is_empty() || longitude.is_empty() {
            msg!("Error: One or more fields are empty.");
            return Err(ProgramError::InvalidArgument.into());
        }

        let data_account = &mut ctx.accounts.data_account;
        let clock = Clock::get().unwrap();

        // Save submission data
        data_account.pdf_hash = pdf_hash;
        data_account.latitude = latitude;
        data_account.longitude = longitude;
        data_account.price = price;
        data_account.depositor = *ctx.accounts.user.key;
        data_account.timestamp = clock.unix_timestamp;
        data_account.deposit_amount = deposit_amount;
        data_account.yay_votes = 0;
        data_account.nay_votes = 0;

        // Transfer lamports from user to data_account
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

    pub fn vote(ctx: Context<Vote>, vote: bool) -> Result<()> {
        let data_account = &mut ctx.accounts.data_account;

        // Only RWRD token holders can vote
        if ctx.accounts.voter_token_account.amount == 0 {
            msg!("Error: Only RWRD token holders can vote.");
            return Err(ProgramError::Custom(1).into());
        }

        // Apply the vote
        if vote {
            data_account.yay_votes += 1;
        } else {
            data_account.nay_votes += 1;
        }

        msg!(
            "Vote casted. Current Votes - YAY: {}, NAY: {}",
            data_account.yay_votes,
            data_account.nay_votes
        );

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let data_account = &mut ctx.accounts.data_account;
        let clock = Clock::get().unwrap();
        let current_time = clock.unix_timestamp;

        // Ensure that 10 seconds have passed
        if current_time < data_account.timestamp + 10 {
            msg!("Withdrawal is not yet allowed. Please wait for 10 seconds since submission.");
            return Err(ProgramError::Custom(0).into());
        }

        // Ensure that only the depositor can withdraw
        if data_account.depositor != *ctx.accounts.user.key {
            msg!("Only the original depositor can withdraw the funds.");
            return Err(ProgramError::IllegalOwner.into());
        }

        // Ensure that withdrawal is allowed (YAY >= NAY)
        if data_account.nay_votes > data_account.yay_votes {
            msg!("Withdrawal denied due to insufficient votes (NAY > YAY).");
            return Err(ProgramError::Custom(2).into());
        }

        // Transfer lamports back to the user
        let amount = data_account.deposit_amount;
        **data_account.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .user
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        // Mint RWRD tokens to the user as a reward
        let mint_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.rwrd_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.rwrd_mint_authority.to_account_info(),
            },
        );
        token::mint_to(mint_ctx, 10_000_000)?; // Reward user with 10 RWRD tokens (assuming 6 decimals)

        msg!(
            "Withdrawal of {} lamports successful. RWRD tokens minted to {}.",
            amount,
            ctx.accounts.user.key
        );

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
pub struct Vote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub voter_token_account: Account<'info, TokenAccount>, // Voter's RWRD token account
    #[account(mut)]
    pub data_account: Account<'info, DataAccount>, // Data account being voted on
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
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>, // User's token account to receive RWRD
    #[account(mut)]
    pub rwrd_mint: Account<'info, Mint>, // RWRD token mint
    pub rwrd_mint_authority: Signer<'info>, // Authority for minting RWRD
    pub token_program: Program<'info, Token>, // Token program
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
    pub yay_votes: u32,
    pub nay_votes: u32,
}

impl DataAccount {
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
        8 + // deposit_amount
        4 + // yay_votes
        4; // nay_votes
}
