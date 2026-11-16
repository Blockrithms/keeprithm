import { headerData } from "./data";

export const Header = () => {
  const { title, introText, details } = headerData;
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="text-muted-foreground md:text-lg">{introText}</p>
      </div>

      <div className="space-y-4">
        {details.map((detail, index) => (
          <p key={index} className={index === 0 ? "text-lg" : ""}>
            {detail}
          </p>
        ))}
      </div>
    </>
  );
};
