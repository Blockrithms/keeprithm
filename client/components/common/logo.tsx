import Link from "next/link";

export const Logo = () => {
  return (
    <Link href="/">
      <div className="flex items-center space-x-1.5 cursor-pointer">
        <span className="font-medium">Keeprithm</span>
      </div>
    </Link>
  );
};
