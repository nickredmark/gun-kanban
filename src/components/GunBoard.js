import { Board } from "./Board";
import { GunContinuousSequence } from "crdt-continuous-sequence";
import React, { useState, useEffect } from "react";

const Gun = require("gun/gun");

const getId = element => element["_"]["#"];

const updateCollection = (update, cs) => element => {
  const id = getId(element);
  update(collection => {
    const newCollection = [...collection];
    let index;
    if ((index = newCollection.findIndex(e => getId(e) === id)) > -1) {
      newCollection[index] = { ...newCollection[index], ...element };
    } else {
      newCollection.push(element);
    }
    cs.sort(newCollection);
    return newCollection;
  });
};

const updateSubCollection = (update, cs, rootId) => (element, key) =>
  update(collection => {
    const newCollection = { ...collection };
    const id = element ? getId(element) : key;
    const root = [...(newCollection[rootId] || [])];
    let elementIndex;
    if ((elementIndex = root.findIndex(e => getId(e) === id)) > -1) {
      if (element) {
        root[elementIndex] = { ...root[elementIndex], ...element };
      } else {
        root.splice(elementIndex, 1);
      }
    } else if (element) {
      root.push(element);
      cs.sort(root);
    }
    newCollection[rootId] = root;
    return newCollection;
  });

const reorder = (
  collection,
  sourceIndex,
  destinationIndex,
  updateCollection,
  cs
) => {
  const newCollection = [...collection];
  const [current] = newCollection.splice(sourceIndex, 1);
  const prev = newCollection[destinationIndex - 1];
  const next = newCollection[destinationIndex];
  newCollection.splice(destinationIndex, 0, current);
  updateCollection(newCollection);
  cs.move(current, prev, next);
};

export const GunBoard = ({ boardId }) => {
  const [gun, setGun] = useState(null);
  const [cs, setCs] = useState(null);
  const [board, setBoard] = useState({});
  const [lanes, setLanes] = useState([]);
  const [laneCards, setLaneCards] = useState({});

  useEffect(() => {
    const gun = Gun({
      peers: ["https://gunjs.herokuapp.com/gun"]
    });
    const cs = new GunContinuousSequence(gun);
    setGun(gun);
    setCs(cs);
  }, []);

  useEffect(() => {
    if (gun && cs) {
      gun
        .get(boardId)
        .on(board => setBoard(b => ({ ...b, ...board })))
        .get("lanes")
        .map()
        .on(updateCollection(setLanes, cs))
        .once(lane => {
          const id = getId(lane);
          gun
            .get(id)
            .get("cards")
            .map()
            .on(updateSubCollection(setLaneCards, cs, id));
        });
    }
  }, [gun, cs]);

  if (!gun || !cs) {
    return <div>Loading...</div>;
  }

  return (
    <Board
      getId={getId}
      boardId={boardId}
      board={board}
      lanes={lanes}
      laneCards={laneCards}
      onCreateLane={title =>
        gun
          .get(boardId)
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
            title
          })
      }
      onSetBoardTitle={title =>
        gun
          .get(boardId)
          .get("title")
          .put(title)
      }
      onSetCardTitle={(id, title) =>
        gun
          .get(id)
          .get("title")
          .put(title)
      }
      onSetLaneTitle={(id, title) =>
        gun
          .get(id)
          .get("title")
          .put(title)
      }
      onMoveLane={(sourceIndex, destinationIndex) =>
        reorder(lanes, sourceIndex, destinationIndex, setLanes, cs)
      }
      onMoveCard={(
        sourceLaneId,
        destinationLaneId,
        sourceIndex,
        destinationIndex
      ) => {
        if (sourceLaneId === destinationLaneId) {
          reorder(
            laneCards[sourceLaneId],
            sourceIndex,
            destinationIndex,
            newLaneCards =>
              setLaneCards({
                ...laneCards,
                [sourceLaneId]: newLaneCards
              }),
            cs
          );
        } else {
          const newSourceCollection = [...laneCards[sourceLaneId]];
          const [current] = newSourceCollection.splice(sourceIndex, 1);

          const newDestinationCollection = [
            ...(laneCards[destinationLaneId] || [])
          ];
          const prev = newDestinationCollection[destinationIndex - 1];
          const next = newDestinationCollection[destinationIndex];
          newDestinationCollection.splice(destinationIndex, 0, current);
          setLaneCards({
            ...laneCards,
            [sourceLaneId]: newSourceCollection,
            [destinationLaneId]: newDestinationCollection
          });

          gun
            .get(sourceLaneId)
            .get("cards")
            .get(getId(current))
            .put(null);
          gun
            .get(destinationLaneId)
            .get("cards")
            .set(current);
          cs.move(current, prev, next);
        }
      }}
    />
  );
};
