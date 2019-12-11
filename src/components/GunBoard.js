import { Board } from "./Board";
import { GunContinuousSequence } from "crdt-continuous-sequence";
import React, { useState, useEffect } from "react";
import { useGun, getPub, getSet, getId, getUUID } from "nicks-gun-utils";

const Gun = require("gun/gun");
require("gun/sea");
require("gun/sea");
require("gun/lib/radix");
require("gun/lib/radisk");
require("gun/lib/store");
require("gun/lib/rindexed");

export const GunBoard = ({ id, priv, epriv }) => {
  const [gun, setGun] = useState(null);
  const pub = getPub(id);
  const pair = pub && priv && { pub, priv, epriv };
  const [data, onData, put] = useGun(Gun, gun, useState, pair);

  useEffect(() => {
    const gun = Gun({
      localStorage: false,
      peers: ["https://gunjs.herokuapp.com/gun", "http://nmr.io:8765/gun"]
    });
    gun.get(id).on(onData);
    gun
      .get(`${id}.lanes`)
      .on(onData)
      .map()
      .on(onData)
      .once(lane =>
        gun
          .get(`${getId(lane)}.cards`)
          .on(onData)
          .map()
          .on(onData)
      );
    setGun(gun);
  }, []);

  const cs = new GunContinuousSequence(gun);

  if (!gun) {
    return <div>Loading...</div>;
  }

  const board = {
    ...data[id],
    lanes: cs.sort(
      getSet(data, `${id}.lanes`).map(lane => {
        return {
          ...lane,
          cards: cs.sort(getSet(data, `${getId(lane)}.cards`))
        };
      })
    )
  };

  return (
    <Board
      board={board}
      id={id}
      writable={!pub || priv}
      onCreateLane={title => {
        const key = getUUID(gun);
        const laneId = `${id}.lanes.${key}`;
        put(
          [laneId, "title", title],
          [`${id}.lanes`, key, { "#": laneId }],
          [id, "updated", +new Date()],
          [id, "lastUpdate", `New Lane: "${title}"`]
        );
      }}
      onCreateCard={(laneId, title) => {
        const key = getUUID(gun);
        const cardId = `${id}.cards.${key}`;
        put(
          [cardId, "title", title],
          [`${laneId}.cards`, key, { "#": cardId }],
          [id, "updated", +new Date()],
          [id, "lastUpdate", `New Card: "${title}"`]
        );
      }}
      onSetBoardTitle={title => put([id, "title", title])}
      onSetCardTitle={(id, title) => put([id, "title", title])}
      onSetLaneTitle={(id, title) => put([id, "title", title])}
      onMoveLane={(id, prev, next) =>
        put([id, "index", JSON.stringify(cs.getIndexBetween(id, prev, next))])
      }
      onMoveCard={(cardId, sourceLaneId, destinationLaneId, prev, next) => {
        const puts = [];
        puts.push([
          cardId,
          "index",
          JSON.stringify(cs.getIndexBetween(cardId, prev, next))
        ]);
        if (sourceLaneId !== destinationLaneId) {
          const key = /[\w\-]+$/.exec(cardId)[0];
          puts.push(
            [`${sourceLaneId}.cards`, key, null],
            [`${destinationLaneId}.cards`, key, { "#": cardId }],
            [id, "updated", +new Date()],
            [
              id,
              "lastUpdate",
              `"${data[cardId] && data[cardId].title}" moved to "${data[
                destinationLaneId
              ] && data[destinationLaneId].title}"`
            ]
          );
        }
        put(...puts);
      }}
    />
  );
};
