import NextTopLoader, { type NextTopLoaderProps } from "nextjs-toploader";

export function TopLoader({
  color = "#29d",
  height = 3,
  showSpinner = false,
  crawl = true,
  speed = 200,
  ...props
}: NextTopLoaderProps) {
  return (
    <NextTopLoader
      color={color}
      height={height}
      showSpinner={showSpinner}
      crawl={crawl}
      speed={speed}
      {...props}
    />
  );
}

export default TopLoader;
