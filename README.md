# Wedding Invitation Platform

A digital wedding invitation platform where users can manage multiple wedding invitations, guests, RSVPs, and more.

## Features

- User authentication (admin/client)
- Create and manage wedding data
- Customizable invitation themes
- Guest management
- RSVP tracking
- Photo/video gallery
- Love story timeline
- Digital gift information
- Wishes/guestbook section

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd wedding-invitation-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   - Create a PostgreSQL database
   - Run the SQL script in `database.sql` to create tables
   - Update `.env` with your database credentials

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get JWT token

### Wedding
- `GET /api/wedding`: Get all weddings for a user
- `POST /api/wedding`: Create a new wedding

### Invitation
- `GET /api/invitation`: Get all invitations for a user
- `POST /api/invitation`: Create a new invitation
- `GET /api/invitation/:slug`: Get invitation details by slug

### Guest
- `GET /api/guest`: Get all guests for a user
- `POST /api/guest`: Add a new guest

### RSVP
- `GET /api/rsvp`: Get all RSVPs for a user
- `POST /api/rsvp`: Submit an RSVP

### Gallery
- `GET /api/gallery`: Get all gallery items for a user
- `POST /api/gallery`: Add a new gallery item

### Love Story
- `GET /api/love-story`: Get all love stories for a user
- `POST /api/love-story`: Add a new love story

### Gift
- `GET /api/gift`: Get all gifts for a user
- `POST /api/gift`: Add a new gift

### Wishes
- `GET /api/wishes`: Get all wishes for a user
- `POST /api/wishes`: Submit a wish

## Database Schema

See `database.sql` for the complete database schema and relationships.

## Environment Variables

Create a `.env` file with the following variables:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=wedding_invitation
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_aws_s3_bucket
```

## License

MIT