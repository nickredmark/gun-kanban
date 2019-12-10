import React, { useState, useRef, useEffect } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { getId } from "nicks-gun-utils";

export const Board = ({
  id,
  board,
  writable,
  onSetBoardTitle,
  onSetCardTitle,
  onMoveLane,
  onMoveCard,
  onCreateLane,
  onSetLaneTitle,
  onCreateCard
}) => {
  const [editing, setEditing] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const newLaneTitle = useRef(null);

  useEffect(() => {
    document.title = board.title || "GUN Kanban";
  }, [board.title]);

  return (
    <DragDropContext
      onDragEnd={({ source, destination, type, draggableId }) => {
        if (
          !destination ||
          (source.droppableId && source.index) ===
            (destination.droppableId === destination.index)
        ) {
          return;
        }

        switch (type) {
          case "LANE":
            const cleanLanes = board.lanes.filter(
              l => getId(l) !== draggableId
            );
            onMoveLane(
              draggableId,
              cleanLanes[destination.index - 1],
              cleanLanes[destination.index]
            );
            break;
          case "CARD":
            const cleanCards = board.lanes
              .find(lane => getId(lane) === destination.droppableId)
              .cards.filter(c => getId(c) !== draggableId);
            onMoveCard(
              draggableId,
              source.droppableId,
              destination.droppableId,
              cleanCards[destination.index - 1],
              cleanCards[destination.index]
            );
            break;
        }
      }}
    >
      <div className="board">
        {editing ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              onSetBoardTitle(newBoardTitle);
              setEditing(false);
            }}
          >
            <input
              autoFocus
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              placeholder="board title"
            />
          </form>
        ) : (
          <h1
            onDoubleClick={
              writable &&
              (e => {
                setNewBoardTitle(board.title);
                setEditing(true);
              })
            }
            className="board-title"
          >
            {(board && board.title) || id}
          </h1>
        )}
        <div className="board-content">
          <Droppable
            droppableId="board"
            type="LANE"
            direction="horizontal"
            isDropDisabled={!writable}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                className="lanes"
                {...provided.droppableProps}
              >
                {board.lanes.map((lane, i) => {
                  const id = getId(lane);
                  return (
                    <Lane
                      key={id}
                      index={i}
                      writable={writable}
                      id={id}
                      lane={lane}
                      onSetLaneTitle={onSetLaneTitle}
                      onSetCardTitle={onSetCardTitle}
                      onCreateCard={onCreateCard}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {writable && (
            <div className="new-lane">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  onCreateLane(newLaneTitle.current.value);
                  newLaneTitle.current.value = "";
                }}
              >
                <input ref={newLaneTitle} placeholder="new lane" />
              </form>
            </div>
          )}
        </div>
      </div>
    </DragDropContext>
  );
};

const Lane = ({
  id,
  lane,
  writable,
  index,
  onSetCardTitle,
  onSetLaneTitle,
  onCreateCard
}) => {
  const [editing, setEditing] = useState();
  const [laneTitle, setLaneTitle] = useState(lane.title);
  const newCardTitle = useRef(null);

  return (
    <Draggable draggableId={id} index={index} isDragDisabled={!writable}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className="lane"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {editing ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                onSetLaneTitle(id, laneTitle);
                setEditing(false);
              }}
            >
              <input
                autoFocus
                value={laneTitle}
                onChange={e => setLaneTitle(e.target.value)}
                placeholder="lane title"
              />
            </form>
          ) : (
            <div
              onDoubleClick={
                writable &&
                (e => {
                  setLaneTitle(lane.title);
                  setEditing(true);
                })
              }
              className="lane-title"
            >
              {lane.title || "No title"}
            </div>
          )}
          <Droppable droppableId={id} type="CARD" isDropDisabled={!writable}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                className="cards"
                {...provided.droppableProps}
              >
                {lane.cards.map((card, i) => {
                  const id = getId(card);
                  return (
                    <Card
                      key={id}
                      id={id}
                      card={card}
                      writable={writable}
                      index={i}
                      onSetTitle={onSetCardTitle}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {writable && (
            <div className="new-card">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  onCreateCard(id, newCardTitle.current.value);
                  newCardTitle.current.value = "";
                }}
              >
                <input ref={newCardTitle} placeholder="new card" />
              </form>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

const Card = ({ index, id, card, writable, onSetTitle }) => {
  const [editing, setEditing] = useState();
  const [cardTitle, setCardTitle] = useState(card.title);
  return (
    <Draggable draggableId={id} index={index} isDragDisabled={!writable}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className="card"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {editing ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                onSetTitle(id, cardTitle);
                setEditing(false);
              }}
            >
              <input
                autoFocus
                value={cardTitle}
                onChange={e => setCardTitle(e.target.value)}
                placeholder="card title"
              />
            </form>
          ) : (
            <div
              onDoubleClick={
                writable &&
                (e => {
                  setCardTitle(card.title);
                  setEditing(true);
                })
              }
              className="card-title"
            >
              {card.title || "No title"}{" "}
              <a href={`/?board=${id}`} target="_blank" className="card-link">
                #
              </a>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
