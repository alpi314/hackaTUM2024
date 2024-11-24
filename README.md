# EnHouse

## 🚀 Inspiration
As students, finding housing abroad can be a daunting challenge, especially in high-demand cities like Munich. The reliance on inaccessible property advertising, such as newspapers and physical ads, creates significant barriers for both tenants and landlords, making the process inefficient and frustrating. EnHouse was inspired by the need to bridge the gap between offline and online property listings, offering a seamless, accessible platform to meet modern housing needs.

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/ACcWF08gnj8/0.jpg)](https://www.youtube.com/watch?v=ACcWF08gnj8)

---

## 🎯 What it Does
EnHouse leverages blockchain technology to:
- **Expand Reach**: Enable offline property advertisements to transition seamlessly into digital platforms.
- **Empower Users**: Provide tenants with richer and more diverse housing options and allow landlords to advertise without requiring prior digital marketing expertise.

---

## 🛠️ How We Built It
Our solution consists of several components:

### **Frontend**
- A frontend application connects directly to users' wallets.
- Provides a Web3-enabled platform with an intuitive and user-friendly interface.

### **Smart Contracts**
- Experimented with Solana smart contracts:
  - Simple contracts for deployment tests.
  - Contracts for temporarily storing and returning deposited amounts.
  - Advanced contracts for minting and reward generation.

### **Token**
- Stores assets and metadata in a raw format, ensuring accessibility and compatibility with the Solana blockchain.

### **Playgrounds**
- Experimental repositories used for testing and prototyping Solana development concepts.

---

## ⚡ Challenges We Faced
- Adapting to the **stateless nature of Solana**, particularly in implementing complex procedures within smart contracts.
- Setting up **development environments** and mastering **unfamiliar programming languages**, requiring extensive learning and adaptation.

---

## 🏆 Accomplishments
- Successfully deployed functional Solana smart contracts.
- Built a platform capable of addressing real-world housing issues, offering a meaningful and impactful solution.

---

## 📚 What We Learned
- Setting up environments in unfamiliar ecosystems often requires more effort than anticipated.
- Mastering Solana's foundational principles was invaluable and facilitated efficient problem-solving.

---

## 🔮 What's Next for EnHouse
1. **Enhancing Smart Contracts**: Introduce more sophisticated contracts with advanced incentives to attract users.
2. **Scaling Adoption**: Grow our user base to address the housing crisis more effectively.
3. **Contributing to the Ecosystem**: Expand the platform to support and integrate deeper within the Solana ecosystem.

---

## 🗂️ Project Structure

- **frontend**: Web3-enabled frontend application connecting users' wallets.
- **smart_contracts**: Contains various smart contracts:
  - Basic contracts for deployment testing.
  - Contracts for temporarily storing and returning deposited amounts.
  - Advanced contracts for minting and reward generation.
- **token**: Stores assets and metadata in raw format for Solana blockchain compatibility.
- **playground**: Experimental repositories used for testing and prototyping Solana development concepts.

---

## 🌟 Get Started
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo-name/EnHouse.git
   cd frontend
   npm install
   npm start
    ```

### 🐳 Docker Setup for Deployment

In the root of the GitHub repository, you'll find Docker files and a `docker-compose.yml` configuration that streamline the deployment process. These are designed to work alongside a Traefik router, enabling you to host and manage a Solana RPC node via your own domain. This setup is particularly useful for testing across multiple computers when you want to avoid relying on the Solana Devnet. Additionally, there is a separate Docker configuration for deploying the frontend (FE), ensuring a seamless and consistent environment for both the backend and frontend components of the project.


## 🛡️ License

This project is licensed under the [MIT License](LICENSE).

---

## 🙌 Acknowledgments

Special thanks to the Solana community, especially Superteam  Germany and the whole hackaTUM organization for their resources and support during development.

