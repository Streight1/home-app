import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';

export function LoginError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mt-4">
      <InlineAlert variant="danger">{message}</InlineAlert>
    </div>
  );
}
