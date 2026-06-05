import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import { getFirstLetter } from "../../utility/textUtils";

interface UserAvatarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  };
}

export function UserAvatar({ user }: UserAvatarProps) {
  return (
    <Avatar className="h-10 w-10 shrink-0">
      <AvatarImage src={user?.profileImageUrl || ""} />

      <AvatarFallback>
        {getFirstLetter(
          user?.firstName ||
            user?.lastName ||
            user?.email ||
            "U"
        )}
      </AvatarFallback>
    </Avatar>
  );
}