import React, { useState, useRef } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

export const Board = ({
  id,
  getId,
  board,
  source,
  sourceField,
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

  return (
    <DragDropContext
      onDragEnd={({ source: src, destination, type, draggableId }) => {
        if (
          !destination ||
          (src.droppableId && src.index) ===
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
            let cleanCards;
            if (source && destination.droppableId === getId(source)) {
              cleanCards = source[sourceField].filter(
                c => getId(c) !== draggableId
              );
            } else {
              cleanCards = board.lanes
                .find(card => getId(card) === destination.droppableId)
                .cards.filter(c => getId(c) !== draggableId);
            }
            onMoveCard(
              draggableId,
              src.droppableId,
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
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              placeholder="board title"
            />
          </form>
        ) : (
          <h1
            onDoubleClick={e => {
              setNewBoardTitle(board.title);
              setEditing(true);
            }}
            className="board-title"
          >
            {(board && board.title) || id}
          </h1>
        )}
        <div className="board-content">
          {source && (
            <div className="source">
              <SourceLane
                getId={getId}
                source={source}
                sourceField={sourceField}
                onSetCardTitle={onSetCardTitle}
              />
            </div>
          )}
          <Droppable droppableId="board" type="LANE" direction="horizontal">
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
                      getId={getId}
                      index={i}
                      id={id}
                      lane={lane}
                      onSetLaneTitle={onSetLaneTitle}
                      onSetCardTitle={onSetCardTitle}
                      onCreateCard={onCreateCard}
                      source={source}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
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
        </div>
      </div>
    </DragDropContext>
  );
};

const SourceLane = ({
  getId,
  source,
  sourceField,
  onSetSourceTitle,
  onSetCardTitle
}) => {
  const [editing, setEditing] = useState();
  const [sourceTitle, setSourceTitle] = useState(source.title);

  return (
    <div className="lane">
      {editing ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            onSetSourceTitle(sourceTitle);
            setEditing(false);
          }}
        >
          <input
            autoFocus
            value={sourceTitle}
            onChange={e => setSourceTitle(e.target.value)}
            placeholder="source title"
          />
        </form>
      ) : (
        <div
          onDoubleClick={e => {
            setSourceTitle(source.title);
            setEditing(true);
          }}
          className="lane-title"
        >
          {source.title || "Source has title"}
        </div>
      )}
      <Droppable droppableId={getId(source)} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            className="cards"
            {...provided.droppableProps}
          >
            {source[sourceField].map((card, i) => {
              const id = getId(card);
              return (
                <Card
                  key={id}
                  id={id}
                  card={card}
                  getId={getId}
                  index={i}
                  onSetTitle={onSetCardTitle}
                />
              );
            })}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const Lane = ({
  getId,
  id,
  lane,
  index,
  onSetCardTitle,
  onSetLaneTitle,
  onCreateCard,
  source
}) => {
  const [editing, setEditing] = useState();
  const [laneTitle, setLaneTitle] = useState(lane.title);
  const newCardTitle = useRef(null);

  return (
    <Draggable draggableId={id} index={index}>
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
                onSetLaneTitle(laneTitle);
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
              onDoubleClick={e => {
                setLaneTitle(lane.title);
                setEditing(true);
              }}
              className="lane-title"
            >
              {lane.title || "No title"}
            </div>
          )}
          <Droppable droppableId={id} type="CARD">
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
                      getId={getId}
                      index={i}
                      onSetTitle={onSetCardTitle}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {!source && (
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

const Card = ({ getId, index, id, card, onSetTitle }) => {
  const [editing, setEditing] = useState();
  const [cardTitle, setCardTitle] = useState(card.title);
  return (
    <Draggable draggableId={id} index={index}>
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
              onDoubleClick={e => {
                setCardTitle(card.title);
                setEditing(true);
              }}
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
