import { Board } from "./Board";
import { GunContinuousSequence } from "crdt-continuous-sequence";
import React, { useState, useEffect } from "react";

const Gun = require("gun/gun");

const getId = element => element["_"]["#"];

const useRerender = () => {
  const [, setRender] = useState({});
  const rerender = () => setRender({});
  return rerender;
};

export const GunBoard = ({ id }) => {
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
    }
  }, [gun]);

  if (!gun || !cs) {
    return <div>Loading...</div>;
  }

  const data = gun._.graph;

  return (
    <Board
      getId={getId}
      data={data}
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
            title
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
          .get("title")
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
        if (sourceLaneId !== destinationLaneId) {
          gun
            .get(sourceLaneId)
            .get("cards")
            .get(id)
            .put(null);
          gun
            .get(destinationLaneId)
            .get("cards")
            .set(data[id]);
        }
      }}
    />
  );
};
