import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ListId } from "@/features/army-list/lib/ListId";
import { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";
import { INVALID_LINK_MESSAGE } from "./ArmyListWorkbench.constants";
import { describeLoadError, fetchListById } from "./ArmyListWorkbench.data";
import type {
  ListSourceControls,
  LoadedList,
  SheetMode,
} from "./ArmyListWorkbench.types";

/** Holds the loaded list, the sheet mode and the state of loading one from a link. */
export function useArmyListWorkbench() {
  const [loaded, setLoaded] = useState<LoadedList | null>(null);
  const [mode, setMode] = useState<SheetMode>("full");
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingLoad = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => pendingLoad.current?.abort();
  }, []);

  /** Loads one list, cancelling any load still in flight so the latest one wins. */
  const load = async (listId: ListId) => {
    pendingLoad.current?.abort();
    const controller = new AbortController();
    pendingLoad.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const { list, glossary } = await fetchListById(listId, {
        signal: controller.signal,
      });
      controller.signal.throwIfAborted();
      setLoaded({
        list,
        rules: SpecialRuleIndex.fromList(list, glossary ?? undefined),
        hasRuleTexts: glossary !== null,
        sourceLabel: listId.shareUrl,
      });
    } catch (loadError) {
      const message = describeLoadError(loadError);

      if (message !== null) {
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

    void load(listId);
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

  return { loaded, mode, setMode, handlePrint, controls };
}
