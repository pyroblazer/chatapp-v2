import { getRepository } from 'typeorm';
import { User } from '../utils/typeorm/entities/User';
import { Profile } from '../utils/typeorm/entities/Profile';
import { UserPresence } from '../utils/typeorm/entities/UserPresence';
import { Peer } from '../utils/typeorm/entities/Peer';
import { hashPassword } from '../utils/helpers';

export async function seedSuperuser() {
  const userRepo = getRepository(User);
  const profileRepo = getRepository(Profile);
  const presenceRepo = getRepository(UserPresence);
  const peerRepo = getRepository(Peer);

  const username = process.env.SUPERUSER_USERNAME || 'admin';
  const password = process.env.SUPERUSER_PASSWORD || 'changeme123!';
  const email = process.env.SUPERUSER_EMAIL || 'admin@chatapp.local';

  const existing = await userRepo.findOne({ where: { username } });
  if (existing) {
    return { created: false, username };
  }

  const hashedPassword = await hashPassword(password);

  const peer = peerRepo.create();
  await peerRepo.save(peer);

  const profile = profileRepo.create({ about: 'System Administrator' });
  await profileRepo.save(profile);

  const presence = presenceRepo.create({
    statusMessage: 'Available',
    showOffline: false,
  });
  await presenceRepo.save(presence);

  const user = userRepo.create({
    username,
    email,
    firstName: 'System',
    lastName: 'Admin',
    password: hashedPassword,
    profile,
    presence,
    peer,
  });
  await userRepo.save(user);

  return { created: true, username, email };
}
