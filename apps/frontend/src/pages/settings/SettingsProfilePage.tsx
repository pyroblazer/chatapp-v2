import { useContext, useEffect, useState } from 'react';
import { MoonLoader } from 'react-spinners';
import { UserBanner } from '../../components/settings/profile/UserBanner';
import { OverlayStyle, Page } from '../../utils/styles';
import {
  ProfileAboutSection,
  ProfileAboutSectionHeader,
  ProfileDescriptionField,
  ProfileEditActionBar,
  ProfileSection,
  SettingsProfileUserDetails,
} from '../../utils/styles/settings';
import { Button } from '../../utils/styles/button';
import { updateUserProfile } from '../../utils/api';
import { AuthContext } from '../../utils/context/AuthContext';
import { CDN_URL } from '../../utils/constants';
import { toast } from 'react-toastify';
import { UserAvatar } from '../../components/settings/profile/UserAvatar';

export const SettingsProfilePage = () => {
  const { user, updateAuthUser } = useContext(AuthContext);

  const [avatarFile, setAvatarFile] = useState<File>();
  const [avatarSource, setAvatarSource] = useState(
    CDN_URL.BASE.concat(user?.profile?.avatar || '')
  );
  const [avatarSourceCopy, setAvatarSourceCopy] = useState(avatarSource);

  const [bannerSource, setBannerSource] = useState(
    CDN_URL.BASE.concat(user?.profile?.banner || '')
  );
  const [bannerFile, setBannerFile] = useState<File>();
  const [bannerSourceCopy, setBannerSourceCopy] = useState(bannerSource);
  const [about, setAbout] = useState(user?.profile?.about || '');
  const [aboutCopy, setAboutCopy] = useState(about);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAbout(user?.profile?.about || '');
  }, [user?.profile?.about]);

  useEffect(() => {
    setBannerSource(CDN_URL.BASE.concat(user?.profile?.banner || ''));
    setBannerSourceCopy(CDN_URL.BASE.concat(user?.profile?.banner || ''));
  }, [user?.profile?.banner]);

  const isChanged = () => aboutCopy !== about || bannerFile || avatarFile;

  const reset = () => {
    setAboutCopy(about);
    setBannerSourceCopy(bannerSource);
    setAvatarSourceCopy(avatarSource);
    setAvatarFile(undefined);
    setBannerFile(undefined);
    URL.revokeObjectURL(bannerSourceCopy);
    URL.revokeObjectURL(avatarSourceCopy);
  };

  const save = async () => {
    const formData = new FormData();
    bannerFile && formData.append('banner', bannerFile);
    avatarFile && formData.append('avatar', avatarFile);
    about !== aboutCopy && formData.append('about', aboutCopy);

    try {
      setLoading(true);
      const { data: updatedUser } = await updateUserProfile(formData);
      URL.revokeObjectURL(bannerSourceCopy);
      URL.revokeObjectURL(avatarSourceCopy);
      setBannerFile(undefined);
      setAvatarFile(undefined);
      updateAuthUser(updatedUser);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <OverlayStyle>
          <MoonLoader size={40} color="#fff" />
        </OverlayStyle>
      )}
      <Page>
        <UserBanner
          bannerSource={bannerSource}
          bannerSourceCopy={bannerSourceCopy}
          setBannerSourceCopy={setBannerSourceCopy}
          setBannerFile={setBannerFile}
        />
        <ProfileSection>
          <SettingsProfileUserDetails>
            <UserAvatar
              avatarSource={avatarSource}
              avatarSourceCopy={avatarSourceCopy}
              setAvatarSourceCopy={setAvatarSourceCopy}
              setAvatarFile={setAvatarFile}
            />
            <span>@{user?.username}</span>
          </SettingsProfileUserDetails>
          <ProfileAboutSection>
            <ProfileAboutSectionHeader>
              <label htmlFor="about">About Me</label>
            </ProfileAboutSectionHeader>
            <ProfileDescriptionField
              maxLength={200}
              value={aboutCopy}
              onChange={(e) => setAboutCopy(e.target.value)}
            />
          </ProfileAboutSection>
        </ProfileSection>
        {isChanged() && (
          <ProfileEditActionBar>
            <div>
              <span>You have unsaved changes</span>
            </div>
            <div className="buttons">
              <Button
                size="md"
                variant="secondary"
                onClick={reset}
                disabled={loading}
              >
                Reset
              </Button>
              <Button size="md" onClick={save} disabled={loading}>
                Save
              </Button>
            </div>
          </ProfileEditActionBar>
        )}
      </Page>
    </>
  );
};
