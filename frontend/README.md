# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Instructions to Run the Code

1. Download and install Node.js and npm:
   Go to the Node.js website and download the latest LTS version (recommended for most users).
   The download includes both Node.js and npm. <br />
   Verify by:
   ```sh
   node -v # This should show the Node.js version
   npm -v # This should show the npm version
   ```
2. Ensure Git is installed:
   Download and install Git from the Git official website. <br />
   Verify by:
   ```sh
   git --version
   ```
3. Clone the repository and navigate to the directory:
   Open your terminal and run the following in our chosen directory: <br />
   ```sh
   git clone https://github.com/RaymondC-tech/SafeSteps.git
   cd SafeSteps
   ```
4. Change directory to frontend and install the required npm packages, then go back:
   ```sh
   cd frontend/
   npm install i
   cd ..
   ```
5. Install python through the official website (Windows), or install and use Homebrew (MacOs):
   ```sh
   brew install python
   ```
6. Using pip, which is installed with python, install the following:
   ```sh
   pip install fastapi uvicorn pydantic requests pymongo motor
   ```
7. Change directory to frontend and enter the following:
   ```sh
   npm run dev
   ```
8. Follow the link that shows up on the terminal

   ```sh
   VITE v6.1.0  ready in 117 ms
    ➜ Local: http://localhost:3000/ # <--- This one
    ➜ Network: use --host to expose
    ➜ press h + enter to show help
   ```

9. Voila, the app shows up on your local web!
