import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private messaging: admin.messaging.Messaging;

  constructor() {
    try {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialized successfully');
      }

      this.messaging = admin.messaging();
    } catch (error) {
      console.error('Failed to initialize Firebase:', error.message);
    }
  }

  async sendPushNotification(token: string, payload: {
    notification: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
  }): Promise<void> {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      await this.messaging.send({
        token,
        ...payload,
      });
      console.log('Push notification sent successfully to token:', token);
    } catch (error) {
      console.error('Error sending push notification:', error.message);
      throw error;
    }
  }

  async sendMulticastNotification(tokens: string[], payload: {
    notification: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
  }): Promise<{ successCount: number; failureCount: number }> {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      const response = await this.messaging.sendMulticast({
        tokens,
        ...payload,
      });

      console.log(`Multicast notification: ${response.successCount} success, ${response.failureCount} failed`);
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Error sending multicast notification:', error.message);
      throw error;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      await this.messaging.subscribeToTopic(tokens, topic);
      console.log(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error.message);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      await this.messaging.unsubscribeFromTopic(tokens, topic);
      console.log(`Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error.message);
      throw error;
    }
  }

  async sendTopicNotification(topic: string, payload: {
    notification: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
  }): Promise<void> {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      await this.messaging.send({
        topic,
        ...payload,
      });
      console.log(`Topic notification sent to: ${topic}`);
    } catch (error) {
      console.error('Error sending topic notification:', error.message);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      if (!admin.apps.length) {
        throw new Error('Firebase app not initialized');
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying ID token:', error.message);
      throw error;
    }
  }
}
