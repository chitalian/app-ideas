import Head from "next/head";
import { useEffect, useState } from "react";
import { ImGithub } from "react-icons/im";
import { CiTwitter } from "react-icons/ci";
import { HeartIcon, TrashIcon, XCircleIcon } from "@heroicons/react/24/outline";
import TwitterIcon from "../public/twitter.png";

interface Idea {
  name: string;
  description: string;
  favorite: boolean;
}
function classNames(...args: string[]): string {
  return args.filter(Boolean).join(" ");
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [sort, setSort] = useState<"all" | "liked">("all");
  useEffect(() => {
    const localIdeas = localStorage.getItem("ideas");
    if (localIdeas !== null) {
      setIdeas(JSON.parse(localIdeas));
    }
  }, []);
  function setIdeasSyncWithLocal(fn: (ideas: Idea[]) => Idea[]) {
    setIdeas((ideas) => {
      const newIdeaList = fn(ideas);
      localStorage.setItem("ideas", JSON.stringify(newIdeaList));
      return newIdeaList;
    });
  }

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
            <a href="https://github.com/chitalian/app-ideas">
              <ImGithub className="w-5 h-5" />
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
                fetch("/api/generate", {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: "text-davinci-002",
                    keywords: description,
                  }),
                })
                  .then((e) => {
                    setLoading(false);
                    if (e.status === 200) {
                      e.json().then((e) => {
                        setIdeasSyncWithLocal((ideas) =>
                          ideas.concat([
                            {
                              name: e.idea,
                              description: e.description,
                              favorite: false,
                            },
                          ])
                        );
                      });
                    } else {
                      e.text().then((e) => console.error(e));
                      setError("Had an issue parsing the result. Try again!");
                    }
                  })
                  .catch((e) => {
                    console.error(e);
                    setError("Had an issue parsing the result. Try again!");
                    setLoading(false);
                  });
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
                  .map((idea) => {
                    let tweetText = `${idea.name} - ${idea.description}\nGenerated by https://aiappideas.com`;

                    return (
                      <div className="w-full relative" key={idea.name}>
                        <div className="border w-full py-2 px-5 flex flex-row justify-between">
                          <div>
                            <div className="text-lg">{idea.name}</div>
                            <div className="pl-5">{idea.description}</div>
                          </div>
                          <button
                            className="hover:text-slate-500 absolute right-10"
                            onClick={() => {
                              setIdeasSyncWithLocal((ideas) => {
                                return ideas.map((i) =>
                                  i.name === idea.name
                                    ? {
                                        favorite: !i.favorite,
                                        name: i.name,
                                        description: i.description,
                                      }
                                    : i
                                );
                              });
                            }}
                          >
                            <HeartIcon
                              className={classNames(
                                "h-4 ",
                                idea.favorite ? "fill-red-500 text-red-500" : ""
                              )}
                            />
                          </button>
                          <a
                            className="hover:text-slate-500 absolute right-5"
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                              tweetText
                            )}`}
                          >
                            <CiTwitter className={classNames("h-4 ")} />
                          </a>
                        </div>
                        <button
                          className="h-5 w-5 hover:text-slate-500 absolute -left-2 -top-2"
                          onClick={() => {
                            setIdeasSyncWithLocal((ideas) =>
                              ideas.filter((i) => i.name !== idea.name)
                            );
                          }}
                        >
                          <XCircleIcon className="h-5 bg-white" />
                        </button>
                      </div>
                    );
                  })}
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
