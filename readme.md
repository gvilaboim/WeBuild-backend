### WeBuild

## Build and Host Your Own Websites - Server

This is the server repository of a MERN (MongoDB, Express, React, Node) stack web application that lets you build and host simple websites. With this app, you can easily create your own website without any prior knowledge of web development.

The app uses the GeoLocation API to detect the location of who's visiting your page and display statistics by region. It also integrates with the Stripe API to offer different plans Basic, Standard and Advanced (still in development).

## Installation

# Clone the repository:

git clone https://github.com/gvilaboim/WeBuild-backend.git

# Install dependencies:

```
cd server
npm install
```

## Create a .env file with the following content:

```
MONGODB_URI=<your-mongodb-uri>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
```

## Start the development server:

```
npm start
```

OR

```
nodemon
```

## Usage

The server should be running on http://localhost:5000.
Use the Stripe integration to process payments for website hosting.
User website data is stored in the MongoDB database.

## Presentation Example

https://webuildproject.netlify.app/webuild/Gon%C3%A7alo%20Vilaboim/Project%20%203%20-%20WeBuild%20-%20Apresentation%20/6471b74ec064a720c206883b

## Credits

This app was built by [Gonçalo Vilaboim](https://github.com/gvilaboim) and [Guilherme Ferreira](https://github.com/gferreira7)

## License

This project is licensed under the MIT License.
