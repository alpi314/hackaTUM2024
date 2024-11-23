// 1. Import dependencies
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
    metadata::{
        create_metadata_accounts_v3,
        mpl_token_metadata::types::DataV2,
        CreateMetadataAccountsV3, 
        Metadata as Metaplex,
    },
};

// 2. Declare Program ID (SolPG will automatically update this when you deploy)
declare_id!("48zQM2WJcVtJYyv2gf2PqsCYawgFkEW9ZqrT61DTAZ7J");

// 3. Define the program and instructions
#[program]
mod token_minter {
    use super::*;
    pub fn init_token(ctx: Context<InitToken>, metadata: InitTokenParams) -> Result<()> {
        let seeds = &["mint".as_bytes(), &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        let token_data: DataV2 = DataV2 {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.mint.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                mint_authority: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &signer
        );

        create_metadata_accounts_v3(
            metadata_ctx,
            token_data,
            false,
            true,
            None,
        )?;

        msg!("Token mint created successfully.");

        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u64) -> Result<()> {
        let seeds = &["mint".as_bytes(), &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            quantity,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(
    params: InitTokenParams
)]
pub struct InitToken<'info> {
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [b"mint"],
        bump,
        payer = payer,
        mint::decimals = params.decimals,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metaplex>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"mint"],
        bump,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

// 5. Define the init token params
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}


use anchor_lang::prelude::*;


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
            return Err(ProgramError::Custom(0).into());
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


        // Reward the user with 1 RWRD token (it has 9 decimal places)

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
