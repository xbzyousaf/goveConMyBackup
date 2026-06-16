import { useQuery } from "@tanstack/react-query";
import { getFirstLetter } from "@/utility/textUtils";

interface Props {
  onSelect: (userId: string) => void;
}

export default function ChatUserPicker({
  onSelect,
}: Props) {
  const { data = [], isLoading } =
    useQuery({
      queryKey: ["/api/chat-users"],
      queryFn: async () => {
        const res = await fetch(
          "/api/chat-users"
        );

        if (!res.ok) {
          throw new Error(
            "Failed to load users"
          );
        }

        return res.json();
      },
    });

  if (isLoading) {
    return (
      <div className="p-4">
        Loading users...
      </div>
    );
  }

  return (
    <div>
      {data.map((u: any) => (
        <div
          key={u.id}
          className="flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-muted"
          onClick={() =>
            onSelect(u.id)
          }
        >
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
            {getFirstLetter(
              `${u.firstName} ${u.lastName}`
            )}
          </div>

          <div>
            <div className="font-medium">
              {u.firstName} {u.lastName}
            </div>

            <div className="text-xs text-muted-foreground">
              {/* {u?.vendorProfile?.companyName || "No Company"} */}
              {u.userType || ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}