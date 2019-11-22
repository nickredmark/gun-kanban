import { Board } from "./Board";
import { GunContinuousSequence } from "crdt-continuous-sequence";
import React, { useState, useEffect } from "react";

const Gun = require("gun/gun");

const getId = element => element && element["_"] && element["_"]["#"];

const useRerender = () => {
  const [, setRender] = useState({});
  const rerender = () => setRender({});
  return rerender;
};

const getSet = (data, id, key) => {
  const entity = data[id];
  if (!entity || !entity[key]) {
    return [];
  }
  const set = data[entity[key]["#"]];
  if (!set) {
    return [];
  }
  const arr = Object.keys(set)
    .filter(key => key !== "_")
    .map(key => set[key])
    .filter(Boolean)
    .map(ref => data[ref["#"]])
    .filter(Boolean);
  return arr;
};

export const GunBoard = ({ id, sourceId, sourceField, cardTitleField }) => {
  const [gun, setGun] = useState(null);
  const [cs, setCs] = useState(null);
  const rerender = useRerender();

  useEffect(() => {
    const gun = Gun({
      peers: ["https://gunjs.herokuapp.com/gun"]
    });
    const cs = new GunContinuousSequence(gun);
    setGun(gun);
    setCs(cs);
  }, []);

  useEffect(() => {
    if (gun) {
      gun
        .get(id)
        .on(rerender)
        .get("lanes")
        .map()
        .on(rerender)
        .get("cards")
        .map()
        .on(rerender);

      if (sourceId && sourceField) {
        gun
          .get(sourceId)
          .on(rerender)
          .get(sourceField)
          .map()
          .on(rerender);
      }
    }
  }, [gun]);

  if (!gun || !cs) {
    return <div>Loading...</div>;
  }

  const data = gun._.graph;
  const board = {
    ...data[id],
    lanes: cs.sort(
      getSet(data, id, "lanes").map(lane => ({
        ...lane,
        cards: cs.sort(
          getSet(data, getId(lane), "cards").map(card => ({
            ...card,
            title: card[cardTitleField]
          }))
        )
      }))
    )
  };
  const source = sourceId &&
    sourceField && {
      ...data[sourceId],
      [sourceField]: cs.sort(
        getSet(data, sourceId, sourceField)
          .filter(
            card =>
              !board.lanes.some(lane =>
                lane.cards.some(c => getId(c) === getId(card))
              )
          )
          .map(card => ({
            ...card,
            title: card[cardTitleField]
          }))
      )
    };

  return (
    <Board
      getId={getId}
      board={board}
      source={source}
      sourceField={sourceField}
      sort={cs.sort}
      id={id}
      onCreateLane={title =>
        gun
          .get(id)
          .get("lanes")
          .set({
            title
          })
      }
      onCreateCard={(id, title) =>
        gun
          .get(id)
          .get("cards")
          .set({
            [cardTitleField]: title
          })
      }
      onSetBoardTitle={title =>
        gun
          .get(id)
          .get("title")
          .put(title)
      }
      onSetCardTitle={(id, title) =>
        gun
          .get(id)
          .get(cardTitleField)
          .put(title)
      }
      onSetLaneTitle={(id, title) =>
        gun
          .get(id)
          .get("title")
          .put(title)
      }
      onMoveLane={(id, prev, next) => cs.move(id, prev, next)}
      onMoveCard={(id, sourceLaneId, destinationLaneId, prev, next) => {
        cs.move(id, prev, next);
        if (sourceLaneId === destinationLaneId) {
          return;
        }
        if (sourceLaneId) {
          gun
            .get(sourceLaneId)
            .get("cards")
            .get(id)
            .put(null);
        }
        if (destinationLaneId) {
          gun
            .get(destinationLaneId)
            .get("cards")
            .set(data[id]);
        }
      }}
    />
  );
};
