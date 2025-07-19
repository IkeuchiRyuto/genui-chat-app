"use client";

import { useChat } from "@ai-sdk/react";
import {
  Button,
  Card,
  CardBody,
  Avatar,
  Spinner,
  Chip,
  ScrollShadow,
  Textarea,
  Spacer,
  Divider,
} from "@heroui/react";
import {
  PaperAirplaneIcon,
  UserIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Card radius="none" shadow="sm">
        <CardBody className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                icon={<SparklesIcon className="w-6 h-6" />}
                color="primary"
                size="md"
                isBordered
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  GenUI Chat
                </h1>
                <p className="text-sm text-default-500">
                  AI powered conversations
                </p>
              </div>
            </div>
            <Chip color="success" variant="flat" size="md">
              オンライン
            </Chip>
          </div>
        </CardBody>
      </Card>

      <Divider />

      {/* Messages Area */}
      <ScrollShadow className="flex-1 bg-default-50">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <Avatar
                icon={<SparklesIcon className="w-8 h-8" />}
                color="primary"
                size="lg"
                className="mb-4"
              />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                AIチャットへようこそ
              </h2>
              <p className="text-default-500 text-center max-w-md">
                何でも聞いてください。最新のAI技術でお手伝いします！
              </p>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar
                    icon={<SparklesIcon className="w-5 h-5" />}
                    color="success"
                    size="md"
                    className="flex-shrink-0"
                  />
                )}

                <Card
                  className={`max-w-[70%] ${
                    message.role === "user" ? "bg-primary" : "bg-content1"
                  }`}
                  shadow="md"
                >
                  <CardBody className="px-4 py-3">
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <p
                              key={`${message.id}-${i}`}
                              className={`text-sm leading-relaxed ${
                                message.role === "user"
                                  ? "text-primary-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {part.text}
                            </p>
                          );
                      }
                    })}
                  </CardBody>
                </Card>

                {message.role === "user" && (
                  <Avatar
                    icon={<UserIcon className="w-5 h-5" />}
                    color="primary"
                    size="md"
                    className="flex-shrink-0"
                  />
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar
                  icon={<SparklesIcon className="w-5 h-5" />}
                  color="success"
                  size="md"
                  className="flex-shrink-0"
                />
                <Card className="bg-content1" shadow="md">
                  <CardBody className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Spinner size="sm" color="primary" />
                      <span className="text-sm text-default-600">
                        AIが考えています...
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        </div>
      </ScrollShadow>

      <Divider />

      {/* Input Area */}
      <Card radius="none" shadow="sm">
        <CardBody className="p-6">
          <div className="max-w-4xl mx-auto w-full">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex gap-3 items-end w-full">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="メッセージを入力してください..."
                  variant="bordered"
                  size="lg"
                  minRows={1}
                  maxRows={4}
                  className="flex-1"
                  classNames={{
                    input: "text-base",
                    inputWrapper:
                      "border-2 data-[focus=true]:border-primary-500 data-[hover=true]:border-primary-300",
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isIconOnly
                  isDisabled={!input.trim() || isLoading}
                  className="min-w-12 h-12 flex-shrink-0"
                >
                  {isLoading ? (
                    <Spinner size="sm" color="current" />
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
