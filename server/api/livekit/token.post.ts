import { AccessToken, TrackSource } from 'livekit-server-sdk';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  // Validate request
  if (!body.room || !body.user) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: room and user'
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
      identity: body.user.id,
      name: body.user.name
    });

    // Add permissions to the token with full access
    at.addGrant({
      roomJoin: true,
      room: body.room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
      roomList: true,
      roomCreate: true,
      roomAdmin: true
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
