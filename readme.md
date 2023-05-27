### - WeBuild
## - Build and Host Your Own Websites - Server

This is the server repository of a MERN (MongoDB, Express, React, Node) stack web application that lets you build and host simple websites. With this app, you can easily create your own website without any prior knowledge of web development.

The app uses the GeoLocation API to detect the location of who's visiting your page and display statistics by region. It also integrates with the Stripe API to offer different plans Basic, Standard and Advanced (still in development).

## Installation

# Clone the repository:
git clone https://github.com/gvilaboim/WeBuild-backend.git

# Install dependencies:
cd your-server-project
npm install

# Create a .env file with the following content:
MONGODB_URI=<your-mongodb-uri>
STRIPE_SECRET_KEY=<your-stripe-secret-key>

# Start the development server:
npm start

## Usage
The server should be running on http://localhost:5000.
Use the Stripe integration to process payments for website hosting.
User website data is stored in the MongoDB database.

## Credits
This app was built by Gonçalo Vilaboim and Guilherme Ferreira.

## License
This project is licensed under the MIT License.