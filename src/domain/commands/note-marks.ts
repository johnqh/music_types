/**
 * The marks a note carries — what it *says*, rather than whether or when it
 * sounds.
 *
 * Pitch, velocity, accidental and voice aside, everything here is notation a
 * reader acts on: articulations, ornaments, the fermata, dynamics and their
 * hairpins, ties and slurs, octave brackets, slides, arpeggios, fingering,
 * lyrics, chord symbols and grace notes.
 *
 * Split from `note-commands.ts`, which had grown past 900 lines as these
 * accumulated. The line between the two files is the one a musician would
 * draw: those commands add, delete, move or resize a note, and these change
 * what is written on one that already exists. `mapNotes` is shared and lives
 * with the former.
 */
import type {
  Accidental,
  Articulation,
  Dynamic,
  GraceNote,
  Hairpin,
  Lyric,
  NoteEvent,
  Ornament,
  Ottava,
  Pitch,
  UUID,
} from "../../index.js";
import { isNoteEvent } from "../../model/score.js";
import { findEvent } from "../score/queries.js";
import type { ScoreCommand } from "./types.js";
import { transformCommand } from "./snapshot.js";
import { withTracks } from "./reflow.js";
import { mapNotes } from "./note-commands.js";

// ---- simple per-note field commands ------------------------------------------

/** Sets the given notes' pitch to an absolute `Pitch`. */
export function changePitchCommand(
  eventIds: UUID[],
  pitch: Pitch,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => ({ ...note, pitch })),
  );
}

/** Sets the given notes' velocity (0-127). */
export function changeVelocityCommand(
  eventIds: UUID[],
  velocity: number,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => ({ ...note, velocity })),
  );
}

/** Sets (or clears, when `articulation` is `undefined`) the given notes' articulation. */
export function changeArticulationCommand(
  eventIds: UUID[],
  articulation: Articulation | undefined,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => {
      if (articulation) return { ...note, articulation };
      const updated: NoteEvent = { ...note };
      delete updated.articulation;
      return updated;
    }),
  );
}

/**
 * Sets (or clears, when `ornament` is `undefined`) the given notes' ornament.
 *
 * Shaped like `changeArticulationCommand` rather than like the fermata toggle,
 * because an ornament is a choice among several rather than an on/off: a menu
 * sets the one it names, and "None" clears. A note carries at most one sign —
 * a trill that is also a turn is not a marking anybody writes.
 */
export function changeOrnamentCommand(
  eventIds: UUID[],
  ornament: Ornament | undefined,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => {
      if (ornament) return { ...note, ornament };
      const updated: NoteEvent = { ...note };
      delete updated.ornament;
      return updated;
    }),
  );
}

/**
 * Puts a fermata on the given notes, or takes it off the ones that have one.
 *
 * Toggles on the *whole selection together* rather than per note: the state is
 * read from whether every selected note already carries one, so a mixed
 * selection gains fermatas rather than flipping each note independently. A
 * control that did the latter would leave a selection half-marked and look
 * broken.
 *
 * Unlike `toggleSlurCommand` this needs no endpoints and refuses nothing — a
 * fermata is a property of a single note, so one note is a perfectly good
 * selection and each marked note stands alone. Chords are marked note by note
 * because that is what the selection contains; the renderer draws one fermata
 * per notehead position, which is what a chord with a pause looks like.
 */
export function toggleFermataCommand(
  eventIds: UUID[],
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    const notes = eventIds
      .map((id) => findEvent(score, id))
      .filter(
        (event): event is NoteEvent => event !== null && isNoteEvent(event),
      );
    if (notes.length === 0) return score;

    // Only remove when every selected note already has one, so a selection
    // that is partly marked becomes fully marked rather than inverting.
    const allMarked = notes.every((note) => note.fermata);

    return mapNotes(score, eventIds, (note) => {
      if (allMarked) {
        const updated: NoteEvent = { ...note };
        delete updated.fermata;
        return updated;
      }
      return { ...note, fermata: true };
    });
  });
}

/**
 * Sets or clears the dynamic marking the given notes start.
 *
 * A dynamic is stored on the note it applies *from* and governs until the next
 * one on that track, so marking one note `f` is how a passage becomes loud —
 * there is nothing to apply to the notes in between, and applying it to each
 * would print a marking under every notehead.
 */
export function changeDynamicCommand(
  eventIds: UUID[],
  dynamic: Dynamic | undefined,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => {
      if (dynamic) return { ...note, dynamic };
      const updated: NoteEvent = { ...note };
      delete updated.dynamic;
      return updated;
    }),
  );
}

/** Sets the given notes' pitch accidental, keeping their step/octave. */
export function changeAccidentalCommand(
  eventIds: UUID[],
  accidental: Accidental,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => ({
      ...note,
      pitch: { ...note.pitch, accidental },
    })),
  );
}

/** Toggles `tieStart` or `tieStop` on the given notes. */
export function toggleTieCommand(
  eventIds: UUID[],
  which: "tieStart" | "tieStop",
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => ({ ...note, [which]: !note[which] })),
  );
}

/**
 * Slurs a selection, or removes the slur it already carries.
 *
 * Takes the whole selection rather than a flag per note, because that is what
 * a slur is: one mark over a run of notes. The caller says "slur these" and
 * this decides which of them is the start and which the stop — marking them
 * individually would let a user create a start with no stop, which draws
 * nothing and is invisible to fix.
 *
 * Endpoints are the earliest and latest note by tick, not the order the ids
 * arrived in: a selection built by shift-clicking around a phrase is still
 * that phrase.
 *
 * Fewer than two notes cannot be slurred — a phrase mark over one note means
 * nothing — and toggling off is offered when the span is already slurred, so
 * the same control removes what it made.
 */
export function toggleSlurCommand(
  eventIds: UUID[],
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    const notes = eventIds
      .map((id) => findEvent(score, id))
      .filter(
        (event): event is NoteEvent => event !== null && isNoteEvent(event),
      )
      .sort((a, b) => a.startTick - b.startTick);
    if (notes.length < 2) return score;

    const first = notes[0];
    const last = notes[notes.length - 1];
    const alreadySlurred = Boolean(first.slurStart && last.slurStop);

    return mapNotes(score, eventIds, (note) => {
      const updated: NoteEvent = { ...note };
      delete updated.slurStart;
      delete updated.slurStop;
      if (alreadySlurred) return updated;
      if (note.id === first.id) updated.slurStart = true;
      if (note.id === last.id) updated.slurStop = true;
      return updated;
    });
  });
}

/**
 * Writes a hairpin across the selection, or removes the one it already has.
 *
 * Shaped like `toggleSlurCommand`, because a hairpin is the same kind of thing
 * — one mark over a run of notes. The caller says "crescendo these" and this
 * decides which of them opens it and which closes it; marking them one at a
 * time would let a user create an opening with no close, which draws nothing
 * and is invisible to fix.
 *
 * Endpoints are the earliest and latest note **by tick**, not the order the
 * ids arrived in, so a selection built by shift-clicking around a phrase is
 * still that phrase.
 *
 * Fewer than two notes is refused: a wedge over one note has nowhere to open
 * to. Re-applying the **same** direction to a span that already carries it
 * removes it, so one control undoes what it made; applying the **other**
 * direction flips it, which is what reaching for the other button means.
 */
export function toggleHairpinCommand(
  eventIds: UUID[],
  hairpin: Hairpin,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    const notes = eventIds
      .map((id) => findEvent(score, id))
      .filter(
        (event): event is NoteEvent => event !== null && isNoteEvent(event),
      )
      .sort((a, b) => a.startTick - b.startTick);
    if (notes.length < 2) return score;

    const first = notes[0];
    const last = notes[notes.length - 1];
    const sameAlready =
      first.hairpinStart === hairpin && Boolean(last.hairpinStop);

    return mapNotes(score, eventIds, (note) => {
      const updated: NoteEvent = { ...note };
      delete updated.hairpinStart;
      delete updated.hairpinStop;
      if (sameAlready) return updated;
      if (note.id === first.id) updated.hairpinStart = hairpin;
      if (note.id === last.id) updated.hairpinStop = true;
      return updated;
    });
  });
}

/**
 * Rolls the selected chords, or stops rolling them.
 *
 * Toggles the whole selection together, like the fermata: the state is read
 * from whether *every* selected note already carries the flag, so a partly
 * marked selection becomes fully marked rather than inverting note by note.
 *
 * The mark belongs to a chord, but the selection is notes — so this simply
 * sets the flag on what was selected and lets the renderer decide. A lone note
 * keeps the flag harmlessly and draws nothing, which is better than refusing:
 * selecting a bar and rolling its chords should not fail because one beat
 * happens to be a single note.
 */
export function toggleArpeggiateCommand(
  eventIds: UUID[],
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    const notes = eventIds
      .map((id) => findEvent(score, id))
      .filter(
        (event): event is NoteEvent => event !== null && isNoteEvent(event),
      );
    if (notes.length === 0) return score;

    const allMarked = notes.every((note) => note.arpeggiate);
    return mapNotes(score, eventIds, (note) => {
      if (allMarked) {
        const updated: NoteEvent = { ...note };
        delete updated.arpeggiate;
        return updated;
      }
      return { ...note, arpeggiate: true };
    });
  });
}

/**
 * Brackets the selection at an octave, or removes the bracket it has.
 *
 * A span like the hairpin: endpoints by tick, two notes minimum, the same
 * displacement twice removes it and a different one replaces it.
 */
export function toggleOttavaCommand(
  eventIds: UUID[],
  ottava: Ottava,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    const notes = eventIds
      .map((id) => findEvent(score, id))
      .filter(
        (event): event is NoteEvent => event !== null && isNoteEvent(event),
      )
      .sort((a, b) => a.startTick - b.startTick);
    if (notes.length < 2) return score;

    const first = notes[0];
    const last = notes[notes.length - 1];
    const sameAlready =
      first.ottavaStart === ottava && Boolean(last.ottavaStop);

    return mapNotes(score, eventIds, (note) => {
      const updated: NoteEvent = { ...note };
      delete updated.ottavaStart;
      delete updated.ottavaStop;
      if (sameAlready) return updated;
      if (note.id === first.id) updated.ottavaStart = ottava;
      if (note.id === last.id) updated.ottavaStop = true;
      return updated;
    });
  });
}

/**
 * Slides between the selected notes, or removes the slide.
 *
 * Two notes exactly is the usual case and two is the minimum: a glissando is
 * a line *between* noteheads, so one note has nothing to slide to. A wider
 * selection slides from its first note to its last, which is what dragging
 * across a run and asking for a slide means.
 */
export function toggleGlissandoCommand(
  eventIds: UUID[],
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    const notes = eventIds
      .map((id) => findEvent(score, id))
      .filter(
        (event): event is NoteEvent => event !== null && isNoteEvent(event),
      )
      .sort((a, b) => a.startTick - b.startTick);
    if (notes.length < 2) return score;

    const first = notes[0];
    const last = notes[notes.length - 1];
    const already = Boolean(first.glissandoStart && last.glissandoStop);

    return mapNotes(score, eventIds, (note) => {
      const updated: NoteEvent = { ...note };
      delete updated.glissandoStart;
      delete updated.glissandoStop;
      if (already) return updated;
      if (note.id === first.id) updated.glissandoStart = true;
      if (note.id === last.id) updated.glissandoStop = true;
      return updated;
    });
  });
}

/**
 * Sets or clears the finger written on the given notes.
 *
 * Blank clears it rather than storing an empty string, which would reserve
 * space beside the notehead and print nothing.
 */
export function setFingeringCommand(
  eventIds: UUID[],
  fingering: string | undefined,
  label: string,
): ScoreCommand {
  const trimmed = fingering?.trim();
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => {
      if (trimmed) return { ...note, fingering: trimmed };
      const updated: NoteEvent = { ...note };
      delete updated.fingering;
      return updated;
    }),
  );
}

/**
 * Sets or clears the syllable sung on one note.
 *
 * One note at a time, unlike the other note commands: every syllable in a line
 * is different, so applying one across a selection could only ever write the
 * same word repeatedly.
 *
 * Blank text clears the lyric rather than storing an empty one — an empty
 * syllable would reserve space under the note and print nothing.
 */
export function setLyricCommand(
  eventId: UUID,
  lyric: Lyric | undefined,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, [eventId], (note) => {
      const updated: NoteEvent = { ...note };
      if (!lyric || lyric.text.trim() === "") {
        delete updated.lyric;
        return updated;
      }
      updated.lyric = {
        text: lyric.text.trim(),
        // `single` is the default the model states, so storing it would only
        // be noise in every saved score.
        ...(lyric.syllabic && lyric.syllabic !== "single"
          ? { syllabic: lyric.syllabic }
          : {}),
      };
      return updated;
    }),
  );
}

/**
 * Sets or clears the chord symbol printed from a note.
 *
 * One note at a time, like a lyric: every chord in a progression is different,
 * so applying one across a selection could only write the same symbol
 * repeatedly. Blank text clears it rather than storing an empty symbol, which
 * would reserve space above the stave and print nothing.
 */
export function setChordSymbolCommand(
  eventId: UUID,
  symbol: string | undefined,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, [eventId], (note) => {
      const updated: NoteEvent = { ...note };
      const trimmed = symbol?.trim();
      if (!trimmed) {
        delete updated.chordSymbol;
        return updated;
      }
      updated.chordSymbol = trimmed;
      return updated;
    }),
  );
}

/**
 * Turns a written note into a grace note on the note that follows it.
 *
 * The note leaves the voice and reappears hanging off its neighbour, and the
 * gap it leaves is filled with a rest — so the bar still adds up, which is the
 * whole reason grace notes are stored on their principal rather than as events
 * of their own.
 *
 * The principal is the next note *in the same voice*, since that is what the
 * ornament leads into. A note with nothing after it cannot become one: an
 * ornament with nothing to ornament would simply vanish from the page.
 */
export function toGraceNoteCommand(eventId: UUID, label: string): ScoreCommand {
  return transformCommand(label, (score) => {
    const tracks = score.tracks.map((track) => ({
      ...track,
      measures: track.measures.map((measure) => ({
        ...measure,
        voices: measure.voices.map((voice) => {
          const index = voice.events.findIndex((e) => e.id === eventId);
          if (index === -1) return voice;

          const source = voice.events[index];
          if (!isNoteEvent(source)) return voice;

          // The principal: the next *note* after it in this voice.
          const principalIndex = voice.events.findIndex(
            (e, i) => i > index && isNoteEvent(e),
          );
          if (principalIndex === -1) return voice;
          const principal = voice.events[principalIndex] as NoteEvent;

          const grace: GraceNote = {
            pitch: source.pitch,
            durationTicks: source.durationTicks,
            slashed: true,
          };

          /*
            Ornaments the source itself carried travel with it, ahead of the
            note it becomes: turning a decorated note into a grace note should
            move the whole ornamental run to the new principal, not silently
            drop everything in front of it.
          */
          const carried: GraceNote[] = [...(source.graceNotes ?? []), grace];

          return {
            ...voice,
            events: voice.events.map((event, i) => {
              // The time the note occupied stays occupied, by a rest: an
              // ornament borrows from its principal, it does not shorten the
              // bar.
              if (i === index)
                return {
                  id: source.id,
                  startTick: source.startTick,
                  durationTicks: source.durationTicks,
                  voiceId: source.voiceId,
                  trackId: source.trackId,
                };
              if (i === principalIndex)
                return {
                  ...principal,
                  graceNotes: [...(principal.graceNotes ?? []), ...carried],
                };
              return event;
            }),
          };
        }),
      })),
    }));
    return withTracks(score, tracks);
  });
}

/** Removes every ornament from the given notes. */
export function clearGraceNotesCommand(
  eventIds: UUID[],
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    mapNotes(score, eventIds, (note) => {
      const updated: NoteEvent = { ...note };
      delete updated.graceNotes;
      return updated;
    }),
  );
}
