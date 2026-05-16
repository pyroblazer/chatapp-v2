import { HttpException, HttpStatus } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { Attachment, AuthenticatedRequest } from './types';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(rawPassword: string) {
  return bcrypt.hash(rawPassword, BCRYPT_ROUNDS);
}

export async function compareHash(rawPassword: string, hashedPassword: string) {
  return bcrypt.compare(rawPassword, hashedPassword);
}

export function isAuthorized(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.user) next();
  else throw new HttpException('Forbidden', HttpStatus.UNAUTHORIZED);
}

export const generateUUIDV4 = () => uuidv4();

export const compressImage = async (attachment: Attachment) => {
  const sharp = (await import('sharp')).default;
  return sharp(attachment.buffer).resize(300).jpeg().toBuffer();
};
