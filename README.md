<div align=center>

![Logo](/logo.png)

# Ixo Message Relayer

![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)![NestJS](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

[![ixo](https://img.shields.io/badge/ixo-project-blue)](https://ixo.foundation)
[![GitHub](https://img.shields.io/github/stars/ixofoundation/jambo?style=social)](https://github.com/ixofoundation/ixo-message-relayer)
![GitHub repo size](https://img.shields.io/github/repo-size/ixofoundation/ixo-message-relayer)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/ixofoundation/ixo-message-relayer/blob/main/LICENSE)

[![Twitter](https://img.shields.io/twitter/follow/ixo_impact?style=social)](https://twitter.com/ixoworld)
[![Medium](https://img.shields.io/badge/Medium-ixo-green)](https://ixoworld.medium.com/)

</div>
<br />

The Ixo Message Relayer is a server that facilitates a meticulously coordinated sequence of operations ensuring mobile-to-web authentication, transaction signing, and secure data passing on the IXO blockchain. The process kicks off with the Login module, where the SDK generates a random hash and a secureHash (which is a SHA-256 hash of the hash and a secureNonce). A QR code, containing this hash, is then displayed for the mobile app to scan. Once scanned, the mobile app uploads the user data to the server using this hash as an identifier of the login request, which the SDK is polling for. This endpoint is secured with an AUTHORIZATION environment variable, ensuring only the mobile app with the correct authorization can upload this data. Subsequently, the SDK polls the server to fetch the login data, providing a secureNonce in the process. The server validates the request by hashing the provided hash and secureNonce to ensure it matches the secureHash, thereby affirming the authenticity of the user making the request. Upon validation, the server returns the login data to the SDK and purges the data from the server to maintain data cleanliness.

The server also includes a Matrix integration feature, enabling the management of Matrix login credentials. The Matrix flow, similar to the login flow, begins with the SDK generating a random hash and a secureHash (derived from the hash and a secureNonce). A QR code containing this hash is then displayed for the mobile app to scan. Once scanned, the mobile app uploads the Matrix login request data to the server using this hash as the identifier.

The Matrix login flow is conditional: it checks whether the user has a Matrix account and whether they are logged in to that account within the mobile app. If these conditions are met, the mobile app can proceed with the Matrix login. The server securely stores the Matrix login data and allows the SDK to poll for this data, similar to the regular login flow. The server validates the request by comparing the provided hash and secureNonce with the stored secureHash, ensuring that the request is authentic.

Upon successful validation, the server returns the Matrix login data to the SDK. A unique Matrix access token is then generated for each 'site' (or client) during this process. This token, which uses the client/site as the device name during its creation, is unique to that specific client/site and can be revoked or deactivated by the user through the mobile app. This revocation can occur at the user's discretion or when they log out of their Matrix profile or switch profiles. The response format for Matrix endpoints is designed to be flexible, allowing for new fields to be added over time while maintaining backward compatibility with existing fields.

The server also supports a secure data passing feature that allows the SDK to encrypt data, store it on the server, and have it decrypted and processed by the mobile app. This feature ensures that only the mobile app with the correct access token can retrieve and decrypt the data, making it useful for operations such as KYC (Know Your Customer) processes. The data is uploaded with an identifier hash and a type indicating the operation to be performed. The mobile app decrypts the data, performs the required operation, and uploads the success status and response to the server.

Note: The following describes the V1 transaction module, which is now deprecated in favor of the enhanced V2 transactions module. Users are encouraged to transition to V2 for a more efficient and dynamic transaction handling experience.

Transitioning to the Transactions module, the SDK creates a transaction request by uploading all the necessary transaction data along with an identifier hash, which is derived from the hash of the transaction data. This hash acts as a unique identifier for the transaction. Upon scanning a QR code generated by the SDK, the mobile app fetches the transaction data from the server using this hash. This endpoint is also protected to ensure only the mobile app can access the transaction data. The mobile app then validates the integrity of the data received from the server by hashing the data and ensuring the hash matches the hash it obtained from the QR code, thereby ensuring data authenticity and thwarting any potential middleman attacks. Following this, the mobile app signs the transaction, broadcasts it to the IXO blockchain, and updates the transaction status on the server, either as success or failure. This update endpoint is also protected to ensure only the mobile app can update the transaction data. Concurrently, the SDK polls the server to fetch the transaction response for the provided hash, allowing it to retrieve the response only for the transaction that was updated by the mobile app.

The V2 Transactions module introduces a more dynamic and efficient approach for handling multiple, sequenced transactions within a session. In this upgraded version, the SDK initiates a transaction session by generating a session hash, a secure hash derived from the hash of the initial transaction data and a secureNonce. This hash serves as a unique identifier for the entire transaction session. The mobile app scans a QR code, generated by the SDK, which contains the session hash. After scanning, the mobile app retrieves the session data, including all transactions in the session at that time, from the server using the session hash. V2 facilitates the addition of multiple transactions to a session, allowing for a sequence of up to 99 transactions. The SDK adds transactions to the active session using the session hash, and the mobile app, in turn, processes each transaction in the sequence. After processing a transaction, the mobile app updates the server with the transaction's status, and the server sets the next transaction in the sequence as active. This continuous cycle persists until all transactions in the session are processed or the session expires. This V2 module's architecture maintains high security and integrity, with endpoints safeguarded to ensure that only the mobile app can access and update transaction data. The server's response structure is consistent, providing clear and immediate feedback on operations' success or failure, facilitating a robust and seamless transaction processing experience for both the mobile app and the SDK.

The server employs long polling techniques on certain endpoints, enhancing data efficiency and ensuring timely updates. This method is particularly evident in the transaction fetch and response endpoints, where the server maintains an open request until new data becomes available or a timeout occurs.

The server's response to all endpoints is structured in a consistent format, encapsulated in an object. This object always contains a success field indicating the success or failure of the intended operation. Additionally, there's a data field which generally houses a message field explaining the reason for the success or failure of the request. If there's data to be provided, it is encapsulated within this data field. For the polling endpoints like login fetch and transaction response, there's an additional code field in the response. A code value of 418 signifies that even if the success field is false, the SDK should continue polling and not throw an error, ensuring a robust and resilient flow of operations.

The server is designed to work seamlessly with a complementary SDK which facilitates the management of various authentication and transaction flows between web clients, mobile applications, and the server itself. For more comprehensive insights and utilization of the server's capabilities, you may explore the SDK source code hosted on [this repository](https://github.com/ixofoundation/ixo-signx) or directly integrate the SDK into your projects via the published [NPM package](https://www.npmjs.com/package/@ixo/signx-sdk).

- [Ixo Message Relayer](#ixo-message-relayer)
  - [Environment Variables](#environment-variables)
    - [Security Note](#security-note)
    - [Usage Note](#usage-note)
  - [Running the app](#running-the-app)
  - [Docker Usage](#docker-usage)
    - [docker-compose.yaml](#docker-composeyaml)
  - [API Documentation](#api-documentation)
  - [Login Endpoints](#login-endpoints)
    - [POST `/login/create`](#post-logincreate)
      - [Parameters](#parameters)
      - [Request Body](#request-body)
      - [Response Body](#response-body)
      - [Response Properties](#response-properties)
      - [Usage](#usage)
    - [POST `/login/fetch`](#post-loginfetch)
      - [Parameters](#parameters-1)
      - [Request Body](#request-body-1)
      - [Response Body](#response-body-1)
      - [Response Properties](#response-properties-1)
      - [Usage](#usage-1)
  - [V1 Transaction Endpoints (deprecated)](#v1-transaction-endpoints-deprecated)
    - [POST `/transaction/create`](#post-transactioncreate)
      - [Parameters](#parameters-2)
      - [Request Body](#request-body-2)
      - [Response Body](#response-body-2)
      - [Response Properties](#response-properties-2)
      - [Usage](#usage-2)
    - [POST `/transaction/fetch`](#post-transactionfetch)
      - [Parameters](#parameters-3)
      - [Request Body](#request-body-3)
      - [Response Body](#response-body-3)
      - [Response Properties](#response-properties-3)
      - [Usage](#usage-3)
    - [POST `/transaction/update`](#post-transactionupdate)
      - [Parameters](#parameters-4)
      - [Request Body](#request-body-4)
      - [Response Body](#response-body-4)
      - [Response Properties](#response-properties-4)
      - [Usage](#usage-4)
    - [POST `/transaction/response`](#post-transactionresponse)
      - [Parameters](#parameters-5)
      - [Request Body](#request-body-5)
      - [Response Body](#response-body-5)
      - [Response Properties](#response-properties-5)
      - [Usage](#usage-5)
  - [V2 Transaction Endpoints](#v2-transaction-endpoints)
    - [POST `/transaction/v2/create`](#post-transactionv2create)
      - [Request Parameters](#request-parameters)
      - [Request Body](#request-body-6)
      - [Response Body](#response-body-6)
      - [Response Properties](#response-properties-6)
    - [POST `/transaction/v2/add`](#post-transactionv2add)
      - [Request Parameters](#request-parameters-1)
      - [Request Body](#request-body-7)
      - [Response Body](#response-body-7)
      - [Response Properties](#response-properties-7)
    - [POST `/transaction/v2/fetch`](#post-transactionv2fetch)
      - [Parameters](#parameters-6)
      - [Request Body](#request-body-8)
      - [Response Body](#response-body-8)
      - [Response Properties](#response-properties-8)
      - [Usage](#usage-6)
    - [POST `/transaction/v2/session`](#post-transactionv2session)
      - [Request Parameters](#request-parameters-2)
      - [Request Body](#request-body-9)
      - [Response Body](#response-body-9)
      - [Response Properties](#response-properties-9)
      - [Usage](#usage-7)
    - [POST `/transaction/v2/update`](#post-transactionv2update)
      - [Parameters](#parameters-7)
      - [Request Body](#request-body-10)
      - [Response Body](#response-body-10)
      - [Response Properties](#response-properties-10)
      - [Usage](#usage-8)
    - [POST `/transaction/v2/response`](#post-transactionv2response)
      - [Parameters](#parameters-8)
      - [Request Body](#request-body-11)
      - [Response Body](#response-body-11)
      - [Response Properties](#response-properties-11)
      - [Usage](#usage-9)
    - [POST `/transaction/v2/next`](#post-transactionv2next)
      - [Parameters](#parameters-9)
      - [Request Body](#request-body-12)
      - [Response Body](#response-body-12)
      - [Response Properties](#response-properties-12)
      - [Usage](#usage-10)
  - [Data Endpoints](#data-endpoints)
    - [POST `/data/create`](#post-datacreate)
      - [Parameters](#parameters-10)
      - [Request Body](#request-body-13)
      - [Response Body](#response-body-13)
      - [Response Properties](#response-properties-13)
      - [Usage](#usage-11)
    - [POST `/data/response`](#post-dataresponse)
      - [Parameters](#parameters-11)
      - [Request Body](#request-body-14)
      - [Response Body](#response-body-14)
      - [Response Properties](#response-properties-14)
      - [Usage](#usage-12)
    - [POST `/data/fetch`](#post-datafetch)
      - [Parameters](#parameters-12)
      - [Request Body](#request-body-15)
      - [Response Body](#response-body-15)
      - [Response Properties](#response-properties-15)
      - [Usage](#usage-13)
    - [POST `/data/update`](#post-dataupdate)
      - [Parameters](#parameters-13)
      - [Request Body](#request-body-16)
      - [Response Body](#response-body-16)
      - [Response Properties](#response-properties-16)
      - [Usage](#usage-14)
  - [Matrix Login Endpoints](#matrix-login-endpoints)
    - [POST `/matrix/login/create`](#post-matrixlogincreate)
      - [Parameters](#parameters-14)
      - [Request Body](#request-body-17)
      - [Response Body](#response-body-17)
      - [Response Properties](#response-properties-17)
      - [Usage](#usage-15)
    - [POST `/matrix/login/fetch`](#post-matrixloginfetch)
      - [Parameters](#parameters-15)
      - [Request Body](#request-body-18)
      - [Response Body](#response-body-18)
      - [Response Properties](#response-properties-18)
      - [Usage](#usage-16)
  - [Types](#types)
    - [TransactionV2Dto](#transactionv2dto)
  - [📃 License](#-license)

## Environment Variables

Ensuring the secure and efficient operation of the Ixo Message Relayer Nest.js server, various environment variables are configured to govern aspects like authorization, and database management. The `.env.example` file illustrates a templated structure of these variables, providing a guideline for environment setup.

Here's an overview of each environment variable and its utility within the application:

- **PORT**: Specifies the port number on which the Nest.js server will run.
- **AUTHORIZATION**: Utilized for authorizing API requests, ensuring they originate from authenticated sources. The Authorization header in API requests must precisely match this value (example: `Bearer u4D81XDt4YsbXo6KSynYFChk`).
- **DATABASE_URL**: The full PostgresQL database uri as provided in example.
- **SENTRY_DSN**: Sentry DNS for Sentry error logging to catch production issues.

### Security Note

It is paramount that sensitive variables such as AUTHORIZATION and DATABASE_URL are secured and not exposed to unauthorized personnel or systems. Employ stringent security practices like utilizing secrets management tools, employing strict access controls, and conducting periodic security audits to ensure the confidentiality and integrity of these critical data points.

### Usage Note

To implement these configurations, developers need to create an `.env` file, using `.env.example` as a template, and supply the appropriate values for each variable, ensuring the secure and tailored operation of the server based on the specific deployment environment and use case.

This environment configuration section can serve as a guide to developers, system administrators, and other stakeholders involved in the deployment and maintenance of the server, providing a structured view of the configurable elements that dictate the server’s functionality and security.

## Running the app

```bash
# Clone the repository
$ git clone https://github.com/ixofoundation/ixo-message-relayer.git
# Navigate to the project directory
$ cd ixo-message-relayer

# Install dependancies
$ yarn install

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Docker Usage

If you prefer to run the application inside a Docker container, we've provided a Docker image for convenience. The image is available at `ghcr.io/ixofoundation/ixo-message-relayer:v1.0.0` and an example docker-compose file is below for reference:

### docker-compose.yaml

```yaml
version: '3.7'
services:
  ixo-message-relayer:
    container_name: ixo-message-relayer
    image: ghcr.io/ixofoundation/ixo-message-relayer:v1.0.0
    build:
      context: .
      dockerfile: Dockerfile
      # Can use a .env file
    env_file: .env
    restart: always
    ports:
      - 3000:3000
    logging:
      driver: 'json-file'
      options:
        max-size: '1m'
        max-file: '1'
    depends_on:
      - ixo-message-relayer-db

  ixo-message-relayer-db:
    container_name: ixo-message-relayer-db
    image: postgres:15.1
    restart: always
    environment:
      - POSTGRES_DB=message-relayer
      - POSTGRES_PASSWORD=pass
    ports:
      - 5432:5432
    volumes:
      - ./data/db:/var/lib/postgresql/data
      - ./prisma/migrations/20230301091449_init/:/docker-entrypoint-initdb.d/
```

## API Documentation

## Login Endpoints

### POST `/login/create`

This endpoint is utilized by the mobile app to store login request data on the server. Upon scanning a QR code generated by the SDK, the mobile app initiates a login request by sending the relevant data to this endpoint. The login data is stored on the server under a unique hash identifier generated by the SDK, which facilitates subsequent polling by the SDK to retrieve this data for user login. The endpoint is protected by an authorization mechanism to ensure that only the mobile app can upload login data.

#### Parameters

- `hash`: A unique identifier for the login request.
- `secureHash`: A secure hash generated by hashing the `hash` and a `secureNonce`.
- `data`: The login request data.
- `success`: A boolean indicating the success status of the login request.

#### Request Body

```json
{
  "hash": "string",
  "secureHash": "string",
  "data": "object",
  "success": "boolean"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.

#### Usage

```bash
curl -X POST https://[server-address]/login/create \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "secureHash": "secureHashValue", "data": { ... }, "success": true}'
```

### POST `/login/fetch`

This endpoint facilitates the retrieval of login request data that was previously stored on the server by the mobile app. The SDK polls this endpoint to fetch the login data for a user based on a unique hash identifier. The server validates the request by hashing the provided hash and a secureNonce to ensure it matches the stored secureHash, thereby affirming the authenticity of the user making the request. Upon validation, the server returns the login data to the SDK and deletes the data from the server to maintain data cleanliness.

#### Parameters

- `hash`: A unique identifier for the login request.
- `secureNonce`: A secure nonce generated by the SDK.

#### Request Body

```json
{
  "hash": "string",
  "secureNonce": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string",
    "data": "object",
    "success": "boolean"
  },
  "code": "number"
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **code**: A code indicating whether the SDK should continue polling (418 if it should continue).
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **data**: The login data
  - **success**: Wether the login was a sucess or fail due to rejection on mobile for example

#### Usage

```bash
curl -X POST https://[server-address]/login/fetch \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "secureNonce": "secureNonceValue"}'
```

## V1 Transaction Endpoints (deprecated)

The following endpoints is the version 1 endpoints for transactions and is only here for backwards compatibility. Please use the [version 2](#v2-transaction-endpoints) endpoints instead

### POST `/transaction/create`

This endpoint is utilized by the SDK to store transaction request data on the server. The SDK initiates a transaction request by sending the relevant data, along with a unique hash identifier (which is also the hash of the transaction data), to this endpoint. This hash facilitates subsequent retrieval of this data by the mobile app for signing and broadcasting the transaction. The endpoint validates the request by hashing the provided transaction data and ensuring it matches the provided hash, thereby affirming the authenticity of the transaction data.

#### Parameters

- `hash`: A unique identifier for the transaction request which is also the hash of the transaction data.
- `address`: The address involved in the transaction.
- `did`: The decentralized identifier involved in the transaction.
- `pubkey`: The public key of the user initiating the transaction.
- `txBodyHex`: The hexadecimal encoded raw txBodyBytes which can be encoded from the registry exported from @ixo/impactxclient-sdk npm package (eg registry.encodeTxBody({ messages, memo }))
- `timestamp`: The stringified utc DateTime, add uniqueness for tx hash to prevent duplicates (eg new Date().toISOString())

#### Request Body

```json
{
  "hash": "string",
  "address": "string",
  "did": "string",
  "pubkey": "string",
  "txBodyHex": "string",
  "timestamp": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string",
    "validUntil": "string"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **validUntil**: The ISO 8601 formatted datetime string indicating the expiry time of the transaction request

#### Usage

```bash
curl -X POST https://[server-address]/transaction/create \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "address": "userAddress", "did": "userDid", "pubkey": "userPubKey", "txBodyHex": "transactionBodyHex", "timestamp": "transactionTimestamp"}'
```

### POST `/transaction/fetch`

This endpoint allows the mobile app to fetch the data of a specific transaction request based on a unique hash identifier. After scanning the QR code displayed by the SDK, the mobile app uses the hash to retrieve the transaction data from this endpoint for signing and broadcasting the transaction. The endpoint is protected to ensure only the mobile app can access the transaction data, and it validates the request by checking the hash against the stored transaction data to ensure data authenticity.

#### Parameters

- `hash`: A unique identifier for the transaction request.

#### Request Body

```json
{
  "hash": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string",
    "address": "string",
    "did": "string",
    "pubkey": "string",
    "txBodyHex": "string",
    "timestamp": "string"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **address**: The address involved in the transaction.
  - **did**: The decentralized identifier involved in the transaction.
  - **pubkey**: The public key of the user initiating the transaction.
  - **txBodyHex**: The hexadecimal representation of the raw encoded transaction body.
  - **timestamp**: The The ISO 8601 formatted timestamp when the transaction request was created.

#### Usage

```bash
curl -X POST https://[server-address]/transaction/fetch \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash"}'
```

### POST `/transaction/update`

This endpoint is leveraged by the mobile app to update a transaction request's data on the server following the signing and broadcasting of the transaction. The mobile app sends the transaction response data to this endpoint, which then updates the corresponding transaction request record on the server. The endpoint is protected to ensure only the mobile app can update the transaction data.

#### Parameters

- `hash`: A unique identifier for the transaction request.
- `data`: The response data of the transaction.
- `success`: A boolean indicating whether the transaction was successful or failed.

#### Request Body

```json
{
  "hash": "string",
  "data": "string",
  "success": "boolean"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.

#### Usage

```bash
curl -X POST https://[server-address]/transaction/update \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "data": "transactionResponseData", "success": true}'
```

### POST `/transaction/response`

This endpoint is utilized by the SDK to poll the server for a response to a specific transaction request. By providing the unique hash identifier for the transaction, the SDK can retrieve the response data updated by the mobile app. This endpoint facilitates the flow where after the mobile app signs and broadcasts the transaction, and updates the server with the response data, the SDK polls this endpoint to obtain the response.

#### Parameters

- `hash`: A unique identifier for the transaction request.

#### Request Body

```json
{
  "hash": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "code": "number",
  "data": {
    "message": "string",
    "data": "string",
    "success": "boolean"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **code**: A code indicating whether the SDK should continue polling (418 if it should continue).
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **data**: The response data of the transaction.
  - **success**: Whether the transaction was a success or fail due to rejection on mobile for example.

#### Usage

```bash
curl -X POST https://[server-address]/transaction/response \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash"}'
```

## V2 Transaction Endpoints

With the introduction of session-based transaction handling, the Ixo Message Relayer now supports a more dynamic and efficient transaction flow, allowing multiple transactions to be grouped and managed within a session.

### POST `/transaction/v2/create`

The V2 Transaction Create endpoint is integral to initiating a transaction session in the Ixo Message Relayer. Differing from the single transaction approach in the original endpoint, this enhanced version supports the creation of a transaction session where multiple transactions are grouped together for sequential execution.

When the SDK sends a transaction request to this endpoint, it includes a batch of transaction data alongside a unique session hash. This session hash, crucial for identifying and validating the transaction session, is generated by hashing the initial transaction data combined with a secure nonce for added security. This process ensures that the subsequent retrieval and processing of these transactions by the mobile app are secure and authenticated.

Upon receiving the request, the endpoint performs a series of validations:

1. Verifies the integrity of the session hash by comparing it against a hash generated from the initial transaction data and the secure nonce.
2. Checks the capacity of the session to ensure it doesn't exceed the prescribed limit of transactions(which is 99 per session).
3. Confirms the sequence and completeness of the transaction data provided.

The successful creation of a transaction session results in the server storing the grouped transactions and returning details of the first active transaction to be processed. This systematic approach allows for a streamlined and efficient handling of multiple transaction requests, maintaining the integrity and sequence of operations throughout the session.

#### Request Parameters

- `hash`: A unique identifier for the transaction session, which is derived from hashing the first transactions hash and the secureNonce together, through the signX sdk utility function `generateSecureHash`
- `address`: The blockchain address of the user.
- `did`: Decentralized Identifier of the user.
- `pubkey`: Public key of the user.
- `transactions`: (a list of transactions to add to session and optional sequence)
  - `hash`: Transaction hash, created through signX sdk util function `hashTransactData`
  - `secureNonce`: The session nonce for additional security.
  - `transactions`: An array of individual [transaction details](#transactionv2dto).

#### Request Body

```json
{
  "hash": "string",
  "address": "string",
  "did": "string",
  "pubkey": "string",
  "transactions": {
    "hash": "string",
    "secureNonce": "string",
    "transactions": TransactionV2Dto[]
  }
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string",
    "activeTransaction": {
      "hash": "string",
      "sequence": "number",
      "validUntil": "string"
    }
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **activeTransaction**: (will be the first transaction in list with sequence 1)
    - **hash**: The hash for the first active transaction
    - **sequence**: The sequence number for the first active transaction (out of all the transactions in the session)
    - **validUntil**: The ISO 8601 formatted datetime string indicating the expiry time of the first active transaction

### POST `/transaction/v2/add`

The V2 Transaction Add endpoint in the Ixo Message Relayer serves a pivotal role in appending additional transactions to an existing session. This feature is particularly beneficial in scenarios where a sequence of transactions is required, and flexibility is needed to add more transactions as the session progresses.

Clients can utilize this endpoint to expand an ongoing transaction session, enabling the dynamic inclusion of new transactions. When a request is made, it includes the session hash, a secure nonce for security validation, and the array of additional transactions to be added to the session.

Key validations performed by the endpoint include:

1. Verification of the session's existence and its current active status.
2. Validation of the session hash using the provided secure nonce, ensuring the request's legitimacy.
3. Evaluation of the session's capacity, confirming that the addition of new transactions does not exceed the maximum limit(99) per session.

Upon successful validation, the additional transactions are queued in the specified sequence within the session. The endpoint then updates the session details and provides information about the next active transaction, if any. This enables a seamless continuation of the transaction process within the session, catering to evolving transaction needs without restarting or creating new sessions.

#### Request Parameters

- `hash`: The session identifier for the transaction session.
- `secureNonce`: The unique session nonce for validating the request.
- `transactions`: An array of individual [transaction details](#transactionv2dto).

#### Request Body

```json
{
  "hash": "string",
  "secureNonce": "string",
  "transactions": TransactionV2Dto[]
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string",
    "activeTransaction": {
      "hash": "string",
      "sequence": "number",
      "validUntil": "string"
    }
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **activeTransaction**:
    - **hash**: The hash for the current active transaction
    - **sequence**: The sequence number for the current active transaction (out of all the transactions in the session)
    - **validUntil**: The ISO 8601 formatted datetime string indicating the expiry time of the current active transaction

### POST `/transaction/v2/fetch`

This endpoint adopts a long polling approach, enhancing the mobile app's ability to retrieve the next active transaction within an ongoing session. Once the first transaction in the session is processed, the mobile app continuously polls this endpoint using the session hash. This efficient polling mechanism maintains an open request until the server identifies the next active transaction in the sequence or until the session times out. This long polling method minimizes data overhead and ensures real-time updates for the mobile app, enabling prompt transaction processing. The endpoint is protected to ensure only the mobile app can access the transaction data.

#### Parameters

- `hash`: The identifier of the transaction session hash to fetch next active transaction for.

#### Request Body

```json
{
  "hash": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "code": "number",
  "data": {
    // active transaction data
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **code**: A code indicating whether the mobile should continue polling (418 if it should continue).
- **data**:
  - Details of the active transaction as queried from prisma

#### Usage

```bash
curl -X POST https://[server-address]/transaction/v2/fetch \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash"}'
```

### POST `/transaction/v2/session`

This endpoint allows the mobile app to access detailed information about a specific transaction session. After scanning the QR code displayed by the SDK, the mobile app uses the session hash to retrieve the transaction session data from this endpoint, including all transactions within the session at the time and their respective states. It also identifies the first active transaction awaiting processing. This endpoint ensures that the mobile app has a complete view of the transaction session, enabling efficient handling of multiple transactions in a sequenced manner. The endpoint is protected to ensure only the mobile app can access the transaction data, and it validates the request by checking the hash (first transaction data hash) against the stored transaction data in the session to ensure data authenticity from the server.

#### Request Parameters

- `hash`: The identifier of the transaction session hash to get data for.

#### Request Body

```json
{
  "hash": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "code": "number",
  "data": {
    // session data
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - Details of the transaction session as queried from prisma, also includes all the transactions of the session

#### Usage

```bash
curl -X POST https://[server-address]/transaction/v2/session \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash"}'
```

### POST `/transaction/v2/update`

This endpoint plays a crucial role in the transaction session lifecycle within the Ixo Message Relayer. This endpoint is utilized by the mobile app to update the server with the outcome of a transaction after signing and broadcasting it on the blockchain. Once the mobile app completes a transaction, it communicates the results back to this endpoint, including the transaction's success status and any associated response data.

Upon receiving this update, the endpoint not only updates the status of the corresponding transaction in the session but also automatically progresses the session by setting the next transaction in the sequence as active. Concurrently, it extends the validity of both the session and the next active transaction by updating their "validUntil" timestamps. This mechanism ensures a smooth transition from one transaction to the next within the session, maintaining a continuous flow of execution.

Additionally, the endpoint provides the details of the next active transaction in its response. This feature enables the mobile app to seamlessly proceed with the next transaction in line, enhancing the efficiency of handling multiple transactions in a sequenced manner.

If the update to the transactions has a `success: false` meaning the transaction was not sucessfully signed and broadcasted to the chain, can be chain error or user denying the transaction, then the session's "validUntil" will be updated to now to stop the session flow, and no next active transaction will be updated to become active.

Security remains paramount, with access to this endpoint being strictly restricted to ensure that only the mobile app can make updates to the transaction data, thereby maintaining the integrity of the transaction session.

#### Parameters

- `hash`: A unique identifier for the transaction request.
- `data`: The response data of the transaction.
- `success`: A boolean indicating whether the transaction was successful or failed.

#### Request Body

```json
{
  "hash": "string",
  "data": "string",
  "success": "boolean"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string",
    "validUntil": "string",
    "activeTransaction": {
      "hash": "string",
      "sequence": "number",
      "validUntil": "string"
    }
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **validUntil**: The ISO 8601 formatted datetime string indicating the expiry time of the session which has just been updated
  - **activeTransaction**: (will be included if there is a new active transaction)
    - **hash**: The hash for the new active transaction
    - **sequence**: The sequence number for the new active transaction (out of all the transactions in the session)
    - **validUntil**: The ISO 8601 formatted datetime string indicating the expiry time of the new active transaction

#### Usage

```bash
curl -X POST https://[server-address]/transaction/v2/update \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "data": "transactionResponseData", "success": true}'
```

### POST `/transaction/v2/response`

This endpoint was created by adopting a long polling approach to enhance the SDK’s ability to receive transaction updates. Utilized by the SDK to monitor server responses for specific transactions within a session, this endpoint is queried with the individual transaction hash. The SDK, through this endpoint, can efficiently track the processing status of transactions updated by the mobile app. After the mobile app signs and broadcasts a transaction, it updates the server with the response data. The SDK then uses long polling at this endpoint to await the response, conserving resources and ensuring timely updates. Furthermore, the endpoint also returns details of the next active transaction within the session if available, providing the SDK with immediate continuity for subsequent transaction handling.

The endpoint is secured through the validation of the provided secureNonce, to ensure session flow and visibility is not interrupted by any 3rd party.

#### Parameters

- `hash`: Transaction identifier for which to fetch the response.
- `secureNonce`: Nonce for validation.
-

#### Request Body

```json
{
  "hash": "string",
  "secureNonce": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "code": "number",
  "data": {
    "message": "string",
    "data": "string",
    "success": "boolean",
    "validUntil": "string",
    "activeTransaction": {
      "hash": "string",
      "sequence": "number",
      "validUntil": "string"
    }
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **code**: A code indicating whether the SDK should continue polling (418 if it should continue).
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **data**: The response data of the transaction.
  - **success**: Whether the transaction was a success or fail due to rejection on mobile for example.
  - **validUntil**: The ISO 8601 formatted datetime string indicating the expiry time of the session
  - **activeTransaction**: (will be included if there is a new active transaction)
    - **hash**: The hash for the current active transaction
    - **sequence**: The sequence number for the current active transaction (out of all the transactions in the session)
    - **validUntil**: The ISO 8601 formatted datetime string indicating the expiry time of the current active transaction

#### Usage

```bash
curl -X POST https://[server-address]/transaction/v2/response \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "secureNonce": "secureNonce"}'
```

### POST `/transaction/v2/next`

This endpoint is specifically designed for the SDK to query the next transaction to process. Once a transaction is completed and updated, the SDK uses this endpoint to determine the next active transaction in the session sequence. The endpoint leverages long polling to efficiently wait for the availability of a new active transaction. Upon receiving the query with the session hash and secure nonce, the endpoint checks for the next transaction in line. If available, it returns this transaction, along with an updated "validUntil" timestamp for both the session and the transaction. This process ensures a seamless transition between transactions within the session, maintaining an efficient and continuous flow. If no immediate active transaction is available, the endpoint uses long polling to provide a real-time update once a transaction becomes active, optimizing resource usage and response times.

The endpoint is secured through the validation of the provided secureNonce, to ensure session flow and visibility is not interrupted by any 3rd party.

#### Parameters

- `hash`: Transaction session identifier for which to fetch the next active transaction for.
- `secureNonce`: Nonce for validation.

#### Request Body

```json
{
  "hash": "string",
  "secureNonce": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "code": "number",
  "data": {
    "message": "string",
    "success": "boolean",
    "activeTransaction": {
      "hash": "string",
      "sequence": "number",
      "validUntil": "string"
    }
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **code**: A code indicating whether the SDK should continue polling (418 if it should continue).
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **success**: To indicate to mobile the request was a success.
  - **activeTransaction**:
    - **hash**: The hash for the new active transaction
    - **sequence**: The sequence number for the new active transaction (out of all the transactions in the session)
    - **validUntil**: The ISO 8601 formatted datetime string indicating the expiry time of the new active transaction

#### Usage

```bash
curl -X POST https://[server-address]/transaction/v2/next \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "secureNonce": "secureNonce"}'
```

These new V2 endpoints enhance the Ixo Message Relayer's capabilities, offering clients a more streamlined and efficient way to manage multiple transactions within a single session. They complement the existing endpoints, providing a comprehensive suite for various transaction management needs.

## Data Endpoints

### POST `/data/create`

This endpoint allows the client to create a secure data request on the server. The client uploads encrypted data, which is stored on the server along with a unique identifier hash and a type indicating the specific operation to be performed by the mobile app (e.g., 'kyc' for Know Your Customer processes). The SDK generates the hash and encrypts the data before sending it to this endpoint. The endpoint ensures that the data remains encrypted and secure until accessed by the mobile app for decryption and processing. The stored data is protected by an authorization mechanism to ensure that only authorized clients (like the mobile app) can fetch the data requests.

#### Parameters

- `hash`: A unique identifier for the data request.
- `data`: The encrypted data.
- `type`: A string indicating the type of operation (e.g. 'kyc').

#### Request Body

```json
{
  "hash": "string",
  "data": "string",
  "type": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.

#### Usage

```bash
curl -X POST https://[server-address]/data/create \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "data": "encryptedData", "type": "kyc"}'
```

### POST `/data/response`

This endpoint is used by the client to poll for the response of a previously created data request. After the mobile app processes the encrypted data, it updates the server with the outcome. The SDK repeatedly checks this endpoint to retrieve the response data, which includes whether the data processing was successful and any relevant response message. The polling process uses a secure nonce for validation, ensuring that only authorized requests can retrieve the data. If the data is not yet processed, the endpoint continues to poll until a response is available or a timeout occurs. This ensures a robust and secure flow of information between the client and mobile app.

#### Parameters

- `hash`: A unique identifier for the data request.
- `secureNonce`: A secure nonce generated by the SDK, taht was used the generate the secureHash.

#### Request Body

```json
{
  "hash": "string",
  "secureNonce": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string",
    "response": "object",
    "success": "boolean"
  },
  "code": "number"
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **code**: A code indicating whether the SDK should continue polling (418 if it should continue).
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **response**: The data handler response (dynamic, determined by mobile app)
  - **success**: Wether the data handling was a sucess or fail due to rejection on mobile for example

#### Usage

```bash
curl -X POST https://[server-address]/data/response \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "secureNonce": "secureNonceValue"}'
```

### POST `/data/fetch`

This endpoint allows the mobile app to fetch the encrypted data associated with a specific data request. By providing the unique identifier hash, the mobile app retrieves the encrypted data and the type of operation to be performed. The mobile app then decrypts the data using the encryption key passed through the QR code or deeplink and performs the specified operation. The endpoint is protected to ensure that only the authorized mobile app can access the encrypted data, maintaining the security and integrity of the data throughout the process.

#### Parameters

- `hash`: A unique identifier for the data request.

#### Request Body

```json
{
  "hash": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "data": "string",
    "type": "string"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **data**: The encoded data.
  - **type**: The data type to determine mobile handling.

#### Usage

```bash
curl -X POST https://[server-address]/data/fetch \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash"}'
```

### POST `/data/update`

This endpoint allows the mobile app to update the server with the status of the data request after processing the encrypted data. The mobile app provides the secure hash, success status, and any response message, which are then stored on the server. The SDK can later retrieve the outcome of the data processing operation by polling the /data/response endpoint. This endpoint ensures that the data handling process is completed securely and that the client is informed of the success or failure of the operation. The endpoint is protected to ensure that only the mobile app can update the data status, maintaining the integrity of the data request lifecycle.

#### Parameters

- `hash`: A unique identifier for the data request.
- `response`: Any response message or object or error message from the data handling. (determined by mobile)
- `success`: A boolean indicating whether the data processing was successful or failed.
- `secureHash`: The secure hash generated by the SDK using the secure nonce, passed to mobile through qr/deeplink.

#### Request Body

```json
{
  "hash": "string",
  "secureHash": "string",
  "success": "boolean",
  "response": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.

#### Usage

```bash
curl -X POST https://[server-address]/data/update \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "secureHash": "secureHashValue", "success": true, "response": "responseMessage"}'
```

## Matrix Login Endpoints

### POST `/matrix/login/create`

This endpoint, similar to the login create endpoint, is utilized by the mobile app to store matrix login request data on the server. Upon scanning a QR code generated by the SDK, the mobile app initiates a matrix login request by sending the relevant data to this endpoint. The matrix login data is stored on the server under a unique hash identifier generated by the SDK, which facilitates subsequent polling by the SDK to retrieve this data for matrix login. The endpoint is protected by an authorization mechanism to ensure that only the mobile app can upload matrix login data.

#### Parameters

- `hash`: A unique identifier for the matrix login request.
- `secureHash`: A secure hash generated by hashing the `hash` and a `secureNonce`.
- `data`: The matrix login request data.
- `success`: A boolean indicating the success status of the matrix login request.

#### Request Body

```json
{
  "hash": "string",
  "secureHash": "string",
  "data": "object",
  "success": "boolean"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string"
  }
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **data**:
  - **message**: A message explaining the success or failure of the request.

#### Usage

```bash
curl -X POST https://[server-address]/matrix/login/create \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "secureHash": "secureHashValue", "data": { ... }, "success": true}'
```

### POST `/matrix/login/fetch`

This endpoint, similar to the login fetch endpoint, facilitates the retrieval of matrix login request data that was previously stored on the server by the mobile app. The SDK polls this endpoint to fetch the matrix login data for a user based on a unique hash identifier. The server validates the request by hashing the provided hash and a secureNonce to ensure it matches the stored secureHash, thereby affirming the authenticity of the user making the request. Upon validation, the server returns the matrix login data to the SDK and deletes the data from the server to maintain data cleanliness.

#### Parameters

- `hash`: A unique identifier for the matrix login request.
- `secureNonce`: A secure nonce generated by the SDK.

#### Request Body

```json
{
  "hash": "string",
  "secureNonce": "string"
}
```

#### Response Body

```json
{
  "success": "boolean",
  "data": {
    "message": "string",
    "data": "object",
    "success": "boolean"
  },
  "code": "number"
}
```

#### Response Properties

- **success**: Indicates whether the request to server was successful.
- **code**: A code indicating whether the SDK should continue polling (418 if it should continue).
- **data**:
  - **message**: A message explaining the success or failure of the request.
  - **data**: The matrix login data
  - **success**: Whether the matrix login was a success or fail due to rejection on mobile for example

#### Usage

```bash
curl -X POST https://[server-address]/matrix/login/fetch \
-H "Content-Type: application/json" \
-d '{"hash": "uniqueHash", "secureNonce": "secureNonceValue"}'
```

## Types

#### TransactionV2Dto

The data transfer object for transactions:

```ts
type TransactionV2Dto = {
  hash: string; // Used for initial transaction validation
  txBodyHex: string; // hex encoded raw txBodyBytes which can be encoded from the registry exported from @ixo/impactxclient-sdk npm package (eg registry.encodeTxBody({ messages, memo }))
  timestamp: string; // stringified utc DateTime, add uniqueness for tx hash to prevent duplicates (eg new Date().toISOString())
  sequence?: number; // sequence number to order transactions on server for mobile signing, if adding more transactions it will append the new transactions list to already existing transactions, thus you can start the sequence at 1 again
};
```

## 📃 License

This SDK is licensed under the Apache 2 License. See the [LICENSE](/LICENSE) file for more information.
