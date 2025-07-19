"use client";

import { useChat } from "@ai-sdk/react";
import { Button, Input, Card, CardBody, Avatar } from "@heroui/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  return (
    <div className="flex flex-col w-full max-w-2xl py-8 mx-auto h-screen">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <Card key={message.id} className="w-full">
            <CardBody className="flex flex-row items-start gap-3">
              <Avatar
                name={message.role === "user" ? "U" : "AI"}
                className={
                  message.role === "user" ? "bg-blue-500" : "bg-green-500"
                }
              />
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">
                  {message.role === "user" ? "User" : "AI"}
                </div>
                <div className="whitespace-pre-wrap">
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <div key={`${message.id}-${i}`}>{part.text}</div>
                        );
                    }
                  })}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            value={input}
            placeholder="Say something..."
            onChange={handleInputChange}
          />
          <Button type="submit" color="primary">
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
