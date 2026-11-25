import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { profileService, type Preferences, type ProfileInput } from '../services/profile.service';

export const profileKeys = {
  all: ['profile'] as const,
  details: () => [...profileKeys.all, 'details'] as const,
  preferences: () => [...profileKeys.all, 'preferences'] as const,
};

export const useProfile = () =>
  useQuery({ queryKey: profileKeys.details(), queryFn: ({ signal }) => profileService.get(signal) });

/** A new picture is a File. `keep` sends nothing. */
export function useUpdateProfile() {
  const client = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: async ({ avatar, ...input }: ProfileInput & { avatar: File | 'keep' | 'remove' }) => {
      const user = await profileService.update(input);
      if (avatar instanceof File) return profileService.setAvatar(avatar);
      return avatar === 'remove' ? profileService.removeAvatar() : user;
    },
    onSuccess: (user) => {
      // The name in the navbar follows.
      updateUser(user);
      return client.invalidateQueries({ queryKey: profileKeys.details() });
    },
  });
}

export const usePreferences = () =>
  useQuery({ queryKey: profileKeys.preferences(), queryFn: ({ signal }) => profileService.getPreferences(signal) });

/** Changes at once and undoes when saving fails. */
export function useSetPreferences() {
  const client = useQueryClient();
  const key = profileKeys.preferences();
  return useMutation({
    mutationFn: (changes: Partial<Preferences>) => profileService.setPreferences(changes),
    onMutate: async (changes) => {
      await client.cancelQueries({ queryKey: key });
      const before = client.getQueryData<Preferences>(key);
      if (before) client.setQueryData(key, { ...before, ...changes });
      return before;
    },
    onError: (_error, _changes, before) => client.setQueryData(key, before),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}
