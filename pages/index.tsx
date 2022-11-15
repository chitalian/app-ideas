import Head from "next/head";
import { useEffect, useState } from "react";
import { CiTwitter } from "react-icons/ci";
import { ImGithub } from "react-icons/im";
import { HeartIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="4 2 18 22" {...props}>
      <path d="M9.593 10.971c-.542 0-.969.475-.969 1.055 0 .578.437 1.055.969 1.055.541 0 .968-.477.968-1.055.011-.581-.427-1.055-.968-1.055zm3.468 0c-.542 0-.969.475-.969 1.055 0 .578.437 1.055.969 1.055.541 0 .968-.477.968-1.055-.001-.581-.427-1.055-.968-1.055z" />
      <path d="M17.678 3H4.947A1.952 1.952 0 0 0 3 4.957v12.844c0 1.083.874 1.957 1.947 1.957H15.72l-.505-1.759 1.217 1.131 1.149 1.064L19.625 22V4.957A1.952 1.952 0 0 0 17.678 3zM14.01 15.407s-.342-.408-.626-.771c1.244-.352 1.719-1.13 1.719-1.13-.39.256-.76.438-1.093.562a6.679 6.679 0 0 1-3.838.398 7.944 7.944 0 0 1-1.396-.41 5.402 5.402 0 0 1-.693-.321c-.029-.021-.057-.029-.085-.048a.117.117 0 0 1-.039-.03c-.171-.094-.266-.16-.266-.16s.456.76 1.663 1.121c-.285.36-.637.789-.637.789-2.099-.067-2.896-1.444-2.896-1.444 0-3.059 1.368-5.538 1.368-5.538 1.368-1.027 2.669-.998 2.669-.998l.095.114c-1.71.495-2.499 1.245-2.499 1.245s.21-.114.561-.275c1.016-.446 1.823-.57 2.156-.599.057-.009.105-.019.162-.019a7.756 7.756 0 0 1 4.778.893s-.751-.712-2.366-1.206l.133-.152s1.302-.029 2.669.998c0 0 1.368 2.479 1.368 5.538 0-.001-.807 1.376-2.907 1.443z" />
    </svg>
  );
}

interface Idea {
  description: string;
  favorite: boolean;
  name: string;
  topic: string;
  uuid: string;
}
function classNames(...args: string[]): string {
  return args.filter(Boolean).join(" ");
}

const getUser = () => {
  // Get uuid from localstorage or create if not exists
  let uuid = localStorage.getItem("user");
  if (uuid === null) {
    uuid = uuidv4().toString();
    localStorage.setItem("user", uuid);
  }
  return uuid;
};

const trackEvent = (event: string, details: string) => {
  fetch("/api/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      details: details,
      event: event,
      user: getUser(),
    }),
  });
};

export default function Home() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [sort, setSort] = useState<"all" | "liked">("all");
  useEffect(() => {
    trackEvent("login", getUser());
    const localIdeas = localStorage.getItem("ideas");
    if (localIdeas !== null) {
      setIdeas(JSON.parse(localIdeas));
      setIdeas((ideas) =>
        ideas.map((i) => {
          if (i.uuid === undefined) {
            return {
              description: i.description,
              favorite: i.favorite,
              name: i.name,
              topic: i.topic,
              uuid: uuidv4(),
            };
          } else {
            return i;
          }
        })
      );
    }
  }, []);

  const setIdeasSyncWithLocal = (fn: (ideas: Idea[]) => Idea[]) => {
    setIdeas((ideas) => {
      const newIdeaList = fn(ideas);
      localStorage.setItem("ideas", JSON.stringify(newIdeaList));
      return newIdeaList;
    });
  };
  const generateNewIdea = (retry: number) => {
    if (retry <= 0) {
      setLoading(false);
      setError(
        "Your hints seem to be confusing the AI, try with a different hint maybe?"
      );
      return;
    }

    fetch("/api/generate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        favourites: ideas.filter((idea) => idea.favorite),
        keywords: description,
        model: "text-davinci-002",
      }),
    })
      .then((e) => {
        if (e.status === 200) {
          setLoading(false);
          e.json().then((e) => {
            setIdeasSyncWithLocal((ideas) =>
              ideas.concat([
                {
                  description: e.description,
                  favorite: false,
                  name: e.idea,
                  topic: e.topic,
                  uuid: uuidv4(),
                },
              ])
            );
            trackEvent("generation", e.idea + " - " + e.description);
          });
        } else {
          e.text().then((e) => {
            trackEvent("parse_error", e);
            console.error(e);
          });
          setError(`Oops! had an issue dont worry! I am retrying for you`);
          generateNewIdea(retry - 1);
        }
      })
      .catch((e) => {
        console.error(e);
        trackEvent("parse_error", e.toString());
        setError(
          "Had some serious issue! Please contact us on discord with a screenshot of our console"
        );
        setLoading(false);
      });
  };

  return (
    <div className="flex justify-between flex-col h-screen items-center">
      <header className="w-full">
        <Head>
          <title>AI App Ideas</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="flex flex-col w-full">
          <h1 className="flex flex-row justify-end p-2 gap-2">
            <a href="https://discord.gg/Xn3kYXkFN8">
              <DiscordIcon className="w-7 h-7" />
            </a>
            <a href="https://github.com/chitalian/app-ideas">
              <ImGithub className="w-7 h-7" />
            </a>
          </h1>
          <h1 className="text-center text-4xl p-8 w-full">AI App Ideas</h1>
        </div>
      </header>
      <main className="mb-auto p-10 max-w-5xl flex flex-col w-full gap-3">
        <div className="flex justify-center">
          <div className="w-full md:w-3/4 flex flex-col items-center gap-5">
            <div className="w-full md:w-3/5 flex flex-col gap-2">
              <div className="text-center">Give the AI some hints...</div>
              <textarea
                rows={2}
                name="description"
                id="description"
                className="shadow-sm  border block w-full resize-none border-t py-2 placeholder-gray-500 sm:text-sm p-5 focus:outline-none"
                placeholder="ex: cooking, legal, chocolate, music, movies, etc.."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div>{error}</div>
            </div>
            <button
              className={
                "border text-xl py-2 px-5 rounded-md bg-white shadow-md hover:bg-slate-200 "
              }
              disabled={loading}
              onClick={() => {
                setLoading(true);
                setError(undefined);
                generateNewIdea(3);
              }}
            >
              {loading ? <LoadingSpinner /> : "Generate"}
            </button>
            {ideas.length > 0 && (
              <div className="w-full flex flex-col gap-3">
                <div>
                  <div>
                    <span className="text-2xl">🥁</span> Here is the next big AI
                    startup idea
                  </div>
                  <div className={"flex flex-row gap-5 mx-5 justify-center"}>
                    <div
                      className={
                        sort === "all"
                          ? "  bg-cyan-600 px-3 rounded-full text-gray-200 text-sm"
                          : "bg-gray-200 px-3 rounded-full text-sm"
                      }
                      onClick={() => setSort("all")}
                    >
                      all
                    </div>
                    <div
                      className={
                        sort === "liked"
                          ? " bg-cyan-600 px-3 rounded-full text-gray-200 text-sm"
                          : " bg-gray-200 px-3 rounded-full text-sm"
                      }
                      onClick={() => setSort("liked")}
                    >
                      liked
                    </div>
                  </div>
                </div>
                {ideas
                  .slice()
                  .reverse()
                  .filter(
                    (i) => sort === "all" || (sort === "liked" && i.favorite)
                  )
                  .map((idea) => (
                    <IdeaCard
                      key={idea.uuid}
                      idea={idea}
                      setIdeasSyncWithLocal={setIdeasSyncWithLocal}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t-2 text-center pt-2">
        Powered by{" "}
        <a href="https://twitter.com/calumbirdo" className="font-bold">
          Calum
        </a>{" "}
        and{" "}
        <a href="https://twitter.com/justinstorre" className="font-bold">
          Justin
        </a>
      </footer>
    </div>
  );

  function LoadingSpinner() {
    return (
      <div role="status">
        <svg
          aria-hidden="true"
          className="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-300"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
}
function IdeaCard({
  idea,
  setIdeasSyncWithLocal,
}: {
  idea: Idea;
  setIdeasSyncWithLocal: (fn: (ideas: Idea[]) => Idea[]) => void;
}) {
  return (
    <div className="w-full relative" key={idea.uuid}>
      <div className="border w-full py-2 px-5 flex flex-row justify-between">
        <div className=" w-full">
          <div className="text-lg flex flex-row justify-between w-full">
            {idea.name}
            <CardActions
              setIdeasSyncWithLocal={setIdeasSyncWithLocal}
              idea={idea}
              className="flex flex-row gap-1"
            />
          </div>
          <div className="pl-5">{idea.description}</div>
        </div>
      </div>
      <button
        className="h-5 w-5 hover:text-slate-500  absolute -left-2 -top-2"
        onClick={() => {
          setIdeasSyncWithLocal((ideas) =>
            ideas.filter((i) => i.uuid !== idea.uuid)
          );
        }}
      >
        <XCircleIcon className="h-5 bg-white" />
      </button>
    </div>
  );
}
function CardActions({
  setIdeasSyncWithLocal,
  idea,
  className,
}: {
  setIdeasSyncWithLocal: (fn: (ideas: Idea[]) => Idea[]) => void;
  idea: Idea;
  className?: string;
}) {
  let tweetText = `${idea.name} - ${idea.description}\nGenerated by https://aiappideas.com`;
  return (
    <div className={className}>
      <div
        className="hover:text-slate-500"
        onClick={() => {
          setIdeasSyncWithLocal((ideas) => {
            return ideas.map((i) =>
              i.name === idea.name && i.description === idea.description
                ? {
                    description: i.description,
                    favorite: !i.favorite,
                    name: i.name,
                    topic: i.topic,
                    uuid: i.uuid,
                  }
                : i
            );
          });
          trackEvent("favourited", idea.name + " - " + idea.description);
        }}
      >
        <HeartIcon
          className={classNames(
            "h-4 ",
            idea.favorite ? "fill-red-500  text-red-500" : ""
          )}
        />
      </div>
      <a
        className="hover:text-slate-500"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          tweetText
        )}`}
      >
        <CiTwitter className={classNames("h-4 ")} />
      </a>
    </div>
  );
}
