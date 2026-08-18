export default function StatusBadge({ completed }: { completed: boolean }) {
return (
<span
className={`px-3 py-1 rounded-full text-sm ${
completed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
}`}
>
{completed ? "Completed" : "Pending"}
</span>
);
}