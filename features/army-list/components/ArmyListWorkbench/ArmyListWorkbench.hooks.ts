import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { ListId } from "@/features/army-list/lib/ListId";
import { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";
import type { PaperSize } from "@/features/army-list/components/ArmyListSheet/ArmyListSheet.types";
import { INVALID_LINK_MESSAGE } from "./ArmyListWorkbench.constants";
import {
  describeLoadError,
  type ListSource,
  linkSource,
  SAMPLE_SOURCE,
} from "./ArmyListWorkbench.data";
import type { ListSourceControls, LoadedList } from "./ArmyListWorkbench.types";

/**
 * Holds the loaded list, the paper size and the state of loading one from a
 * link. The page's list id picks what loads: that list, or the sample when
 * there is none. Loading a link goes to the list's own page.
 */
export function useArmyListWorkbench(routeListId: string | null) {
  const router = useRouter();
  const [loaded, setLoaded] = useState<LoadedList | null>(null);
  const [paper, setPaper] = useState<PaperSize>("a4");
  const [link, setLink] = useState(
    () => parseRouteListId(routeListId)?.shareUrl ?? ""
  );
  // A list page paints the loading outline from the start, never an empty page.
  const [isLoading, setIsLoading] = useState(routeListId !== null);
  const [error, setError] = useState<string | null>(null);
  const pendingLoad = useRef<AbortController | null>(null);

  const loadRouteList = useEffectEvent((id: string | null) => {
    const listId = parseRouteListId(id);

    if (listId === null) {
      void load(SAMPLE_SOURCE);
      return;
    }

    setLink(listId.shareUrl);
    void load(linkSource(listId));
  });

  useEffect(() => {
    loadRouteList(routeListId);

    return () => pendingLoad.current?.abort();
  }, [routeListId]);

  // Chrome names a printed PDF after the page title.
  const listTitle = loaded?.list.title;

  useEffect(() => {
    if (listTitle === undefined) {
      return;
    }

    const appTitle = document.title;
    document.title = listTitle;

    return () => {
      document.title = appTitle;
    };
  }, [listTitle]);

  /**
   * Loads one list, cancelling any load still in flight so the latest one wins.
   * A sample that fails to load leaves the page empty rather than showing an
   * error the user did not cause.
   */
  const load = async (source: ListSource) => {
    pendingLoad.current?.abort();
    const controller = new AbortController();
    pendingLoad.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const { list, glossary } = await source.fetchList({
        signal: controller.signal,
      });
      controller.signal.throwIfAborted();
      setLoaded({
        list,
        rules: SpecialRuleIndex.fromList(list, glossary ?? undefined),
        hasRuleTexts: glossary !== null,
        sourceLabel: source.label,
        isSample: source.isSample,
      });
    } catch (loadError) {
      const message = describeLoadError(loadError);

      // A newer load replaced this one, so its failure is no longer news.
      if (message !== null && !source.isSample && !controller.signal.aborted) {
        setError(message);
      }
    } finally {
      if (pendingLoad.current === controller) {
        pendingLoad.current = null;
        setIsLoading(false);
      }
    }
  };

  const onLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLink(event.currentTarget.value);
  };

  const onLinkSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const listId = ListId.fromUserInput(link);

    if (listId === null) {
      setError(INVALID_LINK_MESSAGE);
      return;
    }

    if (listId.value === routeListId) {
      void load(linkSource(listId));
      return;
    }

    // The list's page does the load. Until it shows, hide the current sheet,
    // so the sample never shows while the user's list is on its way.
    pendingLoad.current?.abort();
    pendingLoad.current = null;
    setError(null);
    setIsLoading(true);
    router.push(listId.pagePath);
  };

  const handlePrint = () => {
    window.print();
  };

  const controls: ListSourceControls = {
    link,
    isLoading,
    error,
    onLinkChange,
    onLinkSubmit,
  };

  return { loaded, paper, setPaper, handlePrint, controls };
}

function parseRouteListId(id: string | null): ListId | null {
  return id === null ? null : ListId.fromId(id);
}
