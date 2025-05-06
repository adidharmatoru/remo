import { AccessToken, TrackSource } from 'livekit-server-sdk';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  // Validate request
  if (!body.room || !body.identity) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: room and identity'
    });
  }

  // Get LiveKit credentials from runtime config
  const { apiKey, apiSecret } = config.livekit;

  if (!apiKey || !apiSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'LiveKit API credentials not configured'
    });
  }

  try {
    // Create a new access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: body.identity,
      name: body.identity
    });

    // Add permissions to the token with full access
    at.addGrant({
      roomJoin: true,
      room: body.room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
      roomList: false,
      roomCreate: false,
      roomAdmin: false
    });

    // Return the token
    return {
      token: await at.toJwt()
    };
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate token'
    });
  }
});
